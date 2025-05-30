// /src/routes/api/create-tgz/+server.ts
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import * as tar from 'tar'
import { auth } from '$lib/stores/auth.svelte'

export async function POST({ request }) {
  try {
    let { jwt, files, filename } = await request.json()
    if (!jwt) throw new Error("jwt is null")
    if (!files || !Array.isArray(files) || files.length === 0) throw new Error("files array is missing or empty")

    const tmp = join(tmpdir(), `tgz-${randomUUID()}`)
    mkdirSync(tmp, { recursive: true })

    for (const file of files) {
      if (!file.filename || typeof file.content !== "string") {
        throw new Error("Each file must have filename and content")
      }
      // Ensure parent directory exists
      const filePath = join(tmp, file.filename)
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, file.content)
    }

    const tgzPath = tmp + ".tgz"
    await tar.c(
      {
        gzip: true,
        file: tgzPath,
        cwd: tmp,
      },
      files.map(f => f.filename)
    )

    const filedata = readFileSync(tgzPath)
    const packageName = filename || `package-${randomUUID()}.tgz`
    const fileid = await auth.client.UploadFile(
      packageName,
      "application/gzip",
      filedata,
      jwt
    )
    rmSync(tmp, { recursive: true, force: true })

    return new Response(JSON.stringify(fileid), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    console.error("Error in POST handler:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
