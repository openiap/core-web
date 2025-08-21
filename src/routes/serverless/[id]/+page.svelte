<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import * as Form from "$lib/components/ui/form/index.js";
  import { HotkeyButton } from "$lib/components/ui/hotkeybutton";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { CustomGraph } from "$lib/customgraph/index.js";
  import { CustomInput } from "$lib/custominput/index.js";
  import { CustomSelect } from "$lib/customselect/index.js";
  import { CustomSuperDebug } from "$lib/customsuperdebug/index.js";
  import { CustomSwitch } from "$lib/customswitch/index.js";
  import Entityselector from "$lib/entityselector/entityselector.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check, RotateCcw, User, Webhook } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { _timeSince } from "../../../helper";
  import { editFormSchemaUser, editFormSchemaAdmin } from "../schema.js";
  import { tick } from "svelte";

  const { data } = $props();

  let profileroles = auth.profile?.roles || [];
  const isAdmin = profileroles.includes("admins");

  let loading = $state(false);
  let selectedduration = $state(usersettings.serverlesstimefilter);
  let durationOptions = [
    { label: "Last 5 minutes", value: "5m" },
    { label: "Last 15 minutes", value: "15m" },
    { label: "Last 1 hour", value: "1h" },
    { label: "Last 2 hours", value: "2h" },
    { label: "Last 1 day", value: "1d" },
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
  ];
  type GraphRow = { [key: string]: any; _id?: string; id?: string | number };
  let tdInstanceLog = $state<GraphRow[]>([]);
  let tdRequestLog = $state<GraphRow[]>([]);
  let tdConsoleLog = $state<GraphRow[]>([]);
  let distroname = $state(data?.item?.distro);
  let runasuser = $state(data?.item?.runas == "" ? true : false);
  let tagname = $state(data?.item?.tag);

  // Instance log
  let gdruntime = $state<Float64Array[]>([]);
  let gdappresponsetime = $state<Float64Array[]>([]);
  let gdboottime = $state<Float64Array[]>([]);

  // Request log
  let gdresponsetime = $state<Float64Array[]>([]);
  let gdcontentsize = $state<Float64Array[]>([]);
  let gdnumrequest = $state<Float64Array[]>([]);
  let selectedtab = $state(0);
  //  Console log
  let gdmessages = $state<Float64Array[]>([]);

  let showerror = $state(false);

  const excludedcols = ["_id", "metadata", "ts", "userid"];

  if (data.item != null) {
    if (data.item.anonymous == null) {
      data.item.anonymous = false;
    }
    data.item = (isAdmin ? editFormSchemaAdmin : editFormSchemaUser).parse(
      data.item,
    );
  }

  const form = superForm(
    defaults(zod(isAdmin ? editFormSchemaAdmin : editFormSchemaUser)),
    {
      dataType: "json",
      validators: zod(isAdmin ? editFormSchemaAdmin : editFormSchemaUser),
      SPA: true,
      onUpdate: async ({ form, cancel }) => {
        if (form.valid) {
          loading = true;
          try {
            let workspaceid = usersettings.currentworkspace;
            if (form.data.alpn == "Select ALPN") {
              // @ts-ignore
              delete form.data.alpn;
            }
            if (form.data.tls == false) {
              // @ts-ignore
              delete form.data.tls;
            }
            if (
              data.item._workspaceid == null ||
              data.item._workspaceid == ""
            ) {
              if (workspaceid == "" || workspaceid == null) {
                toast.error("Error", {
                  description: "Please select a workspace",
                });
                cancel();
                loading = false;
                return;
              }
              form.data._workspaceid = workspaceid;
            }
            if (
              form.data._workspaceid != workspaceid &&
              workspaceid != null &&
              workspaceid != ""
            ) {
              form.data._workspaceid = workspaceid;
            }

            if (runasuser) {
              // let item = await auth.client.FindOne<any>({
              //   collectionname: "users",
              //   query: { _id: form.data.runas, _type: "user" },
              //   projection: {
              //     _id: 1,
              //   },
              //   jwt: auth.access_token,
              // });
              // if (item == null || item == undefined) {
              //   toast.error("Error", {
              //     description: "User not found",
              //   });
              //   cancel();
              //   loading = false;
              //   return;
              // }
              const newtoken: any = await auth.client.CustomCommand({
                command: "issueusertoken",
                // @ts-ignore
                data: {
                  _workspaceid: form.data._workspaceid,
                  id: form.data.runas,
                  name: "SF for " + form.data.name,
                  exp: "365d", // 1 year
                },
                jwt: auth.access_token,
              });
              form.data.runas = JSON.parse(newtoken).id;
            }
            // else {
            //   let item = await auth.client.FindOne<any>({
            //     collectionname: "usertokens",
            //     query: { _id: form.data.runas, _type: "usertoken", revoked: false },
            //     jwt: auth.access_token,
            //   });
            //   if (item == null) {
            //     toast.error("Error", {
            //       description: "Access token not found",
            //     });
            //     cancel();
            //     loading = false;
            //     return;
            //   }
            // }
            await auth.client.CustomCommand({
              command: "ensuresfunc",
              // @ts-ignore
              data: form.data,
              jwt: auth.access_token,
            });

            toast.success("Serverless Function updated");
            goto(base + `/serverless`);
          } catch (error: any) {
            toast.error("Error", {
              description: error.message,
            });
            cancel();
            loading = false;
          }
        } else {
          let errors = Object.keys(form.errors).map(
            (key) => key + " is " + form.errors[key],
          );
          if (errors.length > 0) {
            toast.error("Error", {
              description: errors.join(", "),
            });
          } else {
            toast.error("Error", {
              description: "Form is invalid",
            });
          }
          cancel();
          loading = false;
        }
      },
    },
  );
  const { form: formData, enhance, message, validateForm } = form;
  try {
    formData.set(data.item);
    validateForm({ update: true });
  } catch (error: any) {
    toast.error("Error while enhancing", {
      description: error.message,
    });
  }

  if (data.paramid == "null") {
    getInstanceLogs();
  }

  async function getInstanceLogs() {
    selectedtab = 1;
    // Fetch instance logs here
    try {
      const { start, end } = getTimeDuration(selectedduration);
      let query = {
        ts: {
          $gte: new Date(start),
          $lte: new Date(end),
        },
      };
      if (data.paramid != "null") {
        if (
          data.item == null ||
          data.item.repo == null ||
          data.item.tag == null
        ) {
          toast.error("Error", {
            description: "Serverless Function not found or incomplete data",
          });
          return;
        }
        // @ts-ignore
        query["metadata.repo"] = data.item.repo;
      }
      const result: any = await auth.client.Query({
        collectionname: "sf_instance_logs",
        top: 100,
        orderby: { ts: -1 },
        query,
        jwt: auth.access_token,
      });
      // Coerce to array depending on API shape
      const newTdInstanceLog = Array.isArray(result)
        ? result
        : (result?.items ?? []);

      // Check if the data is the same then do not update the table
      const currentHash = JSON.stringify(tdInstanceLog);
      const newHash = JSON.stringify(newTdInstanceLog);
      if (currentHash !== newHash) {
        tdInstanceLog = newTdInstanceLog;
      }

      await getGDInstanceLog();
    } catch (error: any) {
      console.error("Error fetching instance logs:", error);
      toast.error("Error fetching instance logs", {
        description: error.message,
      });
    }
  }
  async function getRequestLogs() {
    selectedtab = 2;
    try {
      const { start, end } = getTimeDuration(selectedduration);
      let query = {
        ts: {
          $gte: new Date(start),
          $lte: new Date(end),
        },
      };
      if (data.paramid != "null") {
        if (
          data.item == null ||
          data.item.repo == null ||
          data.item.tag == null
        ) {
          toast.error("Error", {
            description: "Serverless Function not found or incomplete data",
          });
          return;
        }
        // @ts-ignore
        query["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        query["code"] = { $ne: 200 };
      }
      const result: any = await auth.client.Query({
        collectionname: "sf_request_logs",
        top: 100,
        orderby: { ts: -1 },
        query,
        jwt: auth.access_token,
      });
      // Coerce to array depending on API shape
      const newTdRequestLog = Array.isArray(result)
        ? result
        : (result?.items ?? []);

      // Check if the data is the same then do not update the table
      const currentHash = JSON.stringify(tdRequestLog);
      const newHash = JSON.stringify(newTdRequestLog);
      if (currentHash !== newHash) {
        tdRequestLog = newTdRequestLog;
      }

      await getGDRequestLog();
    } catch (error: any) {
      console.error("Error fetching request logs:", error);
      toast.error("Error fetching request logs", {
        description: error.message,
      });
    }
  }
  async function getConsoleLogs() {
    selectedtab = 3;
    try {
      const { start, end } = getTimeDuration(selectedduration);
      let query = {
        ts: {
          $gte: new Date(start),
          $lte: new Date(end),
        },
      };
      if (data.paramid != "null") {
        if (
          data.item == null ||
          data.item.repo == null ||
          data.item.tag == null
        ) {
          toast.error("Error", {
            description: "Serverless Function not found or incomplete data",
          });
          return;
        }
        // @ts-ignore
        query["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        query["err"] = { $eq: true };
      }
      const result: any = await auth.client.Query({
        collectionname: "sf_console_logs",
        top: 100,
        orderby: { ts: -1 },
        query,
        jwt: auth.access_token,
      });
      // Coerce to array depending on API shape
      const newTdConsoleLog = Array.isArray(result)
        ? result
        : (result?.items ?? []);

      // Check if the data is the same then do not update the table
      const currentHash = JSON.stringify(tdConsoleLog);
      const newHash = JSON.stringify(newTdConsoleLog);
      if (currentHash !== newHash) {
        tdConsoleLog = newTdConsoleLog;
      }
      // await getGDConsoleLog();
    } catch (error: any) {
      console.error("Error fetching console logs:", error);
      toast.error("Error fetching console logs", {
        description: error.message,
      });
    }
  }
  function getTimeDuration(duration: string): { start: string; end: string } {
    // Example duration string: "15m", "1h", "2d"
    // here based in the durration string return start and end time in an object in the format 2025-08-08T19:33:43.441Z
    const end = new Date();
    let start = new Date();

    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error("Invalid duration format");
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        start.setSeconds(start.getSeconds() - value);
        break;
      case "m":
        start.setMinutes(start.getMinutes() - value);
        break;
      case "h":
        start.setHours(start.getHours() - value);
        break;
      case "d":
        start.setDate(start.getDate() - value);
        break;
    }
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  // New: shared helper to detect time-like columns by name
  function isTimeLikeColumn(col: string): boolean {
    const key = col?.toLowerCase?.() ?? "";
    return key === "ts" || key === "time";
  }

  function shouldFormatAsTimeSince(col: string, val: any): boolean {
    if (val == null) return false;
    // use shared detector for column name
    const likely = isTimeLikeColumn(col);
    if (!likely) return false;
    if (val instanceof Date) return !isNaN(val.getTime());
    if (typeof val === "string") return !isNaN(new Date(val).getTime());
    if (typeof val === "number") return !isNaN(new Date(val).getTime());
    // common Mongo shape
    if (typeof val === "object" && "$date" in val) {
      return !isNaN(new Date((val as any).$date).getTime());
    }
    return false;
  }

  async function gotoTokenUser() {
    try {
      const tokendata = await auth.client.FindOne<any>({
        collectionname: "usertokens",
        query: { _id: $formData?.runas, _type: "usertoken" },
        projection: { _userid: 1 },
        jwt: auth.access_token,
      });
      if (tokendata == null) {
        toast.error("Error", {
          description: "Access token not found",
        });
        return;
      }
      goto(base + `/user/${tokendata._userid}`);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to fetch user for access token",
      });
    }
  }

  async function getGDInstanceLog() {
    try {
      const { start, end } = getTimeDuration(selectedduration);
      const agg1 = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            run_time_sec: "$run_time",
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
            run_time_sec: 1,
          },
        },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            run_time_array: { $push: "$run_time_sec" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$run_time_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        agg1[0].$match["metadata.repo"] = data.item.repo;
      }
      let gdruntimeres = await auth.client.Aggregate<any>({
        collectionname: "sf_instance_logs",
        aggregates: agg1,
        jwt: auth.access_token,
      });
      if (gdruntimeres.length > 0) {
        let newgdruntime = [
          new Float64Array(gdruntimeres[0].arrays[0]),
          new Float64Array(gdruntimeres[0].arrays[1]),
        ];
        const currentHash = JSON.stringify(gdruntime);
        const newHash = JSON.stringify(newgdruntime);
        if (currentHash !== newHash) {
          gdruntime = newgdruntime;
        }
      } else {
        // Clear chart data if no data available
        gdruntime = [];
      }

      let agg2 = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            boot_time_sec: "$boot_time",
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
            boot_time_sec: 1,
          },
        },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            boot_time_array: { $push: "$boot_time_sec" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$boot_time_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        agg2[0].$match["metadata.repo"] = data.item.repo;
      }
      let gdboottimeres = await auth.client.Aggregate<any>({
        collectionname: "sf_instance_logs",
        aggregates: agg2,
        jwt: auth.access_token,
      });

      if (gdboottimeres.length > 0) {
        let newgdboottime = [
          new Float64Array(gdboottimeres[0].arrays[0]),
          new Float64Array(gdboottimeres[0].arrays[1]),
        ];
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(gdboottime);
        const newHash = JSON.stringify(newgdboottime);
        if (currentHash !== newHash) {
          gdboottime = newgdboottime;
        }
      } else {
        // Clear chart data if no data available
        const currentHash = JSON.stringify(gdboottime);
        const newHash = JSON.stringify([]);
        if (currentHash !== newHash) {
          gdboottime = [];
        }
      }

      let agg3 = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            app_response_time_sec: "$app_response_time",
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
            app_response_time_sec: 1,
          },
        },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            app_response_time_array: { $push: "$app_response_time_sec" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$app_response_time_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        agg3[0].$match["metadata.repo"] = data.item.repo;
      }
      let gdresponsetimeres = await auth.client.Aggregate<any>({
        collectionname: "sf_instance_logs",
        aggregates: agg3,
        jwt: auth.access_token,
      });
      if (gdresponsetimeres.length > 0) {
        let newgdappresponsetime = [
          new Float64Array(gdresponsetimeres[0].arrays[0]),
          new Float64Array(gdresponsetimeres[0].arrays[1]),
        ];
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(gdappresponsetime);
        const newHash = JSON.stringify(newgdappresponsetime);
        if (currentHash !== newHash) {
          gdappresponsetime = newgdappresponsetime;
        }
      } else {
        // Clear chart data if no data available
        const currentHash = JSON.stringify(gdappresponsetime);
        const newHash = JSON.stringify([]);
        if (currentHash !== newHash) {
          gdappresponsetime = [];
        }
      }
    } catch (error: any) {
      console.error("Error fetching chart data:", error);
      toast.error("Error fetching chart data", {
        description: error.message,
      });
    }
  }

  async function getGDRequestLog() {
    try {
      const { start, end } = getTimeDuration(selectedduration);
      let gdresponsetime_agg = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            response_time_sec: "$response_time",
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
            response_time_sec: 1,
          },
        },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            response_time_array: { $push: "$response_time_sec" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$response_time_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdresponsetime_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        gdresponsetime_agg[0].$match["code"] = { $ne: 200 };
      }
      let gdresponsetimeres = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdresponsetime_agg,
        jwt: auth.access_token,
      });
      if (gdresponsetimeres.length > 0) {
        let newgdresponsetime = [
          new Float64Array(gdresponsetimeres[0].arrays[0]),
          new Float64Array(gdresponsetimeres[0].arrays[1]),
        ];
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(gdresponsetime);
        const newHash = JSON.stringify(newgdresponsetime);
        if (currentHash !== newHash) {
          gdresponsetime = newgdresponsetime;
        }
      } else {
        // Clear chart data if no data available
        const currentHash = JSON.stringify(gdresponsetime);
        const newHash = JSON.stringify([]);
        if (currentHash !== newHash) {
          gdresponsetime = [];
        }
      }

      let gdcontentsize_agg = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            bytes_received_sec: "$bytes_received",
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
            bytes_received_sec: 1,
          },
        },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            bytes_received_array: { $push: "$bytes_received_sec" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$bytes_received_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdcontentsize_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        gdcontentsize_agg[0].$match["code"] = { $ne: 200 };
      }
      let gdcontentsizeres = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdcontentsize_agg,
        jwt: auth.access_token,
      });
      if (gdcontentsizeres.length > 0) {
        let newgdcontentsize = [
          new Float64Array(gdcontentsizeres[0].arrays[0]),
          new Float64Array(gdcontentsizeres[0].arrays[1]),
        ];
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(gdcontentsize);
        const newHash = JSON.stringify(newgdcontentsize);
        if (currentHash !== newHash) {
          gdcontentsize = newgdcontentsize;
        }
      } else {
        // Clear chart data if no data available
        const currentHash = JSON.stringify(gdcontentsize);
        const newHash = JSON.stringify([]);
        if (currentHash !== newHash) {
          gdcontentsize = [];
        }
      }

      let gdnumrequest_agg = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            value: 1, // or "$bytes_received" / "$count" etc. depending on your metric
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // → seconds
            value: 1,
          },
        },
        { $sort: { ts_epoch: 1 } },
        // { $limit: "$maxDataPoints" },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            value_array: { $push: "$value" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$value_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdnumrequest_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        gdnumrequest_agg[0].$match["code"] = { $ne: 200 };
      }
      let gdnumrequestres = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdnumrequest_agg,
        jwt: auth.access_token,
      });
      if (gdnumrequestres.length > 0) {
        let newgdnumrequest = [
          new Float64Array(gdnumrequestres[0].arrays[0]),
          new Float64Array(gdnumrequestres[0].arrays[1]),
        ];
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(gdnumrequest);
        const newHash = JSON.stringify(newgdnumrequest);
        if (currentHash !== newHash) {
          gdnumrequest = newgdnumrequest;
        }
      } else {
        // Clear chart data if no data available
        const currentHash = JSON.stringify(gdnumrequest);
        const newHash = JSON.stringify([]);
        if (currentHash !== newHash) {
          gdnumrequest = [];
        }
      }
    } catch (error: any) {
      console.error("Error fetching chart data:", error);
      toast.error("Error fetching chart data", {
        description: error.message,
      });
    }
  }

  async function getGDConsoleLog() {
    try {
      const { start, end } = getTimeDuration(selectedduration);
      // here i want to count the messages and add it to the chart
      let gdresponsetime_agg = [
        {
          $match: {
            ts: { $gte: new Date(start), $lt: new Date(end) },
          },
        },
        {
          $project: {
            ts_epoch: { $toLong: { $toDate: "$ts" } }, // ms epoch
            response_time_sec: "$response_time",
          },
        },
        {
          $project: {
            ts_epoch: { $divide: ["$ts_epoch", 1000] }, // convert ms → seconds
            response_time_sec: 1,
          },
        },
        {
          $group: {
            _id: null,
            ts_array: { $push: "$ts_epoch" },
            response_time_array: { $push: "$response_time_sec" },
          },
        },
        {
          $project: {
            _id: 0,
            arrays: ["$ts_array", "$response_time_array"],
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdresponsetime_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        gdresponsetime_agg[0].$match["err"] = { $eq: true };
      }
      let gdresponsetimeres = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdresponsetime_agg,
        jwt: auth.access_token,
      });
      if (gdresponsetimeres.length > 0) {
        let newgdresponsetime = [
          new Float64Array(gdresponsetimeres[0].arrays[0]),
          new Float64Array(gdresponsetimeres[0].arrays[1]),
        ];
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(gdresponsetime);
        const newHash = JSON.stringify(newgdresponsetime);
        if (currentHash !== newHash) {
          gdresponsetime = newgdresponsetime;
        }
      } else {
        // Clear chart data if no data available
        const currentHash = JSON.stringify(gdresponsetime);
        const newHash = JSON.stringify([]);
        if (currentHash !== newHash) {
          gdresponsetime = [];
        }
      }
    } catch (error: any) {
      console.error("Error fetching chart data:", error);
      toast.error("Error fetching chart data", {
        description: error.message,
      });
    }
  }

  function OpenLink() {
    if (auth.config.serverless_domain_schema.indexOf(".localhost.") > -1) {
      window.open(
        "http://" +
          auth.config.serverless_domain_schema.replace(
            "$slug$",
            data.item.repo,
          ),
        "_blank",
      );
    }
    window.open(
      "//" +
        auth.config.serverless_domain_schema.replace("$slug$", data.item.repo),
      "_blank",
    );
  }

  function getSuperDebugData() {
    if (selectedtab == 0) return formData;
    if (selectedtab == 1) return tdInstanceLog;
    if (selectedtab == 2) return tdRequestLog;
    if (selectedtab == 3) return tdConsoleLog;
  }
</script>

{#snippet DurationSelect({
  onChange,
}: {
  onChange: (value: string) => void | Promise<void>;
})}
  <CustomSelect
    triggerContent={() => {
      return durationOptions.find((option) => option.value === selectedduration)
        ?.label;
    }}
    type="single"
    selectitems={durationOptions}
    width="w-fit"
    bind:value={selectedduration}
    onValueChangeFunction={async (value: string) => {
      usersettings.serverlesstimefilter = value;
      await usersettings.dopersist();
      selectedduration = value;
      if (typeof onChange === "function") {
        await onChange(value);
      }
    }}
  />
{/snippet}

{#snippet ReloadData({ onChange }: { onChange: () => void | Promise<void> })}
  <HotkeyButton
    title="Reload Data"
    disabled={loading}
    aria-label="Reload Data"
    onclick={async () => {
      loading = true;
      try {
        if (typeof onChange === "function") {
          await onChange();
          toast.success("Data reloaded successfully");
        }
      } catch (error: any) {
        toast.error("Error reloading data", {
          description: error.message,
        });
      } finally {
        loading = false;
      }
    }}
  >
    <RotateCcw />
    Reload Data
  </HotkeyButton>
{/snippet}

{#snippet ToggleErrors({ onChange }: { onChange: () => void | Promise<void> })}
  <div class="flex flex-row items-center space-x-2 py-4">
    <div>Show Errors</div>
    <CustomSwitch
      disabled={loading}
      bind:checked={showerror}
      onclick={async () => {
        await tick();
        await onChange();
      }}
    />
  </div>
{/snippet}

{#snippet LogsTable({
  rows,
  cols,
  headClassFor,
  cellClassFor,
}: {
  rows: any[];
  cols?: string[];
  headClassFor?: (col: string) => string;
  cellClassFor?: (col: string, val: any) => string;
})}
  {#if Array.isArray(rows) && rows.length > 0}
    <Table.Root class="mb-4">
      <Table.Header>
        <Table.Row>
          {#each cols && cols.length > 0 ? cols : Object.keys(rows[0]) as col}
            {#if cols && cols.length > 0 ? true : !excludedcols.includes(col)}
              <Table.Head
                class={headClassFor
                  ? headClassFor(col)
                  : isTimeLikeColumn(col)
                    ? "whitespace-nowrap w-0"
                    : undefined}>{col}</Table.Head
              >
            {/if}
          {/each}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each rows as row, i (row?._id ?? row?.id ?? i)}
          <Table.Row>
            {#each cols && cols.length > 0 ? cols : Object.keys(rows[0]) as col}
              {#if cols && cols.length > 0 ? true : !excludedcols.includes(col)}
                <Table.Cell
                  class={cellClassFor
                    ? cellClassFor(col, row[col])
                    : isTimeLikeColumn(col)
                      ? "pr-3 whitespace-nowrap align-top text-muted-foreground"
                      : undefined}
                >
                  {#if shouldFormatAsTimeSince(col, row[col])}
                    {_timeSince(new Date(row[col]?.$date ?? row[col]))}
                  {:else if typeof row[col] === "object"}
                    {JSON.stringify(row[col])}
                  {:else}
                    {row[col]}
                  {/if}
                </Table.Cell>
              {/if}
            {/each}
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {:else}
    <div class="text-muted-foreground text-sm">
      No data for selected duration.
    </div>
  {/if}
{/snippet}

<Tabs.Root value={data.paramid != "null" ? "1" : "2"} class="w-full">
  <div class="flex items-center gap-4">
    <Tabs.List
      class="h-fit grid grid-cols-1 md:block w-full md:w-fit bg-bw200 dark:bg-darkagenttab rounded-[15px] p-1 mb-10 lg:mb-0"
    >
      {#if data.paramid != "null"}
        <Tabs.Trigger value="1" onclick={() => (selectedtab = 0)}
          >Settings</Tabs.Trigger
        >
      {/if}
      <Tabs.Trigger value="2" onclick={getInstanceLogs}
        >Instance Log</Tabs.Trigger
      >
      <Tabs.Trigger value="3" onclick={getRequestLogs}>Request Log</Tabs.Trigger
      >
      <Tabs.Trigger value="4" onclick={getConsoleLogs}>Console Log</Tabs.Trigger
      >
    </Tabs.List>
    {#if data.paramid != "null"}
      <HotkeyButton
        disabled={loading}
        aria-label="Open in web"
        title="Open in web"
        onclick={() => {
          OpenLink();
        }}
      >
        <Webhook />
        Open in web
      </HotkeyButton>
    {/if}
  </div>
  {#if data.paramid != "null"}
    <Tabs.Content value="1" class="mt-6">
      {#if message && $message != ""}
        {$message}
      {/if}
      {#if $formData != null}
        <form method="POST" use:enhance>
          <Form.Field {form} name="name" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Name</Form.Label>
                <CustomInput
                  placeholder="Type name"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.name}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="tag" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Tag</Form.Label>
                <Entityselector
                  width="md:w-fit w-64"
                  class="mb-4 md:mb-0"
                  {loading}
                  {...props}
                  collectionname="sf"
                  basefilter={{ _type: "image", repo: $formData.repo }}
                  bind:value={$formData.tag}
                  handleChangeFunction={(item: any) => {
                    if (item != null) {
                      $formData.tag = item.tag;
                      tagname = item.tag;
                    }
                  }}
                  returnobject={true}
                >
                  {#snippet rendername(item: any)}
                    {item.name}
                  {/snippet}
                  {#snippet rendercontent(item: any)}
                    {#if tagname == null || tagname == ""}
                      Nothing selected
                    {:else}
                      {tagname}
                    {/if}
                  {/snippet}
                </Entityselector>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="repo" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Repo</Form.Label>
                <CustomInput
                  placeholder="Type repo"
                  disabled={true}
                  {...props}
                  bind:value={$formData.repo}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <!-- insert CustomSwitch for field anonymous -->
          <Form.Field {form} name="anonymous" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-row items-center space-x-2 py-4">
                  <Form.Label>Anonymous</Form.Label>
                  <CustomSwitch
                    disabled={loading}
                    {...props}
                    bind:checked={$formData.anonymous}
                  />
                </div>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="distro" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Distro</Form.Label>
                <Entityselector
                  width="md:w-fit w-64"
                  class="mb-4 md:mb-0"
                  {loading}
                  {...props}
                  collectionname="sf"
                  basefilter={{ _type: "distro" }}
                  bind:value={$formData.distro}
                  handleChangeFunction={(item: any) => {
                    if (item != null) {
                      $formData.distro = item.repo + ":" + item.tag;
                      distroname = item.repo + ":" + item.tag;
                    }
                  }}
                  returnobject={true}
                >
                  {#snippet rendername(item: any)}
                    {item.name}
                  {/snippet}
                  {#snippet rendercontent(item: any)}
                    {#if distroname == null || distroname == ""}
                      Nothing selected
                    {:else}
                      {distroname}
                    {/if}
                  {/snippet}
                </Entityselector>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="environment" class="w-full mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Environment</Form.Label>
                <ObjectInput
                  disabled={loading}
                  {...props}
                  bind:value={$formData.environment}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="min_instances" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>min_instances</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type min_instances"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.min_instances}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="max_instances" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>max_instances</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type max_instances"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.max_instances}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="port" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Port</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type Port"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.port}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="minimum_response_time" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Minimum Response Time</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type Minimum Response Time"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.minimum_response_time}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="tls" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-row items-center space-x-2 py-4">
                  <Form.Label>TLS</Form.Label>
                  <CustomSwitch
                    disabled={loading}
                    {...props}
                    bind:checked={$formData.tls}
                  />
                </div>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="alpn" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>ALPN</Form.Label>
                <CustomSelect
                  type="single"
                  {loading}
                  {...props}
                  selectitems={[
                    { label: "Select ALPN", value: "Select ALPN" },
                    { label: "h2", value: "h2" },
                    { label: "h2h1", value: "h2h1" },
                    { label: "h1", value: "h1" },
                  ]}
                  bind:value={$formData.alpn}
                  triggerContent={() => {
                    return $formData.alpn;
                  }}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <!-- add token selection here set _id to the -->
          <!-- or select user then create api key for that user and add the _id of the apikey to default 1 year expiration -->
          <!-- runas key -->
          <Form.Field {form} name="runas" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label
                  >Run as ({runasuser ? "User" : "Access Token"})</Form.Label
                >
                <div class="flex items-center space-x-2 py-4">
                  <Form.Label>Access token</Form.Label>
                  <CustomSwitch
                    bind:checked={runasuser}
                    onclick={() => {
                      $formData.runas = "";
                    }}
                  />
                  <Form.Label>User</Form.Label>
                </div>
                {#if runasuser}
                  <div class="md:flex md:items-center md:space-x-4 my-2">
                    <Entityselector
                      name="User"
                      propertyname="_id"
                      queryas={usersettings.currentworkspace}
                      width="md:w-fit w-64"
                      class="mb-4 md:mb-0"
                      disabled={loading}
                      collectionname="users"
                      basefilter={{ _type: "user" }}
                      bind:value={$formData.runas}
                      allowunselect={false}
                    >
                      {#snippet rendername(item: any)}
                        {"(" + item._type + ") " + item.name}
                      {/snippet}
                      {#snippet rendercontent(item: any)}
                        {#if item == null}
                          Nothing selected
                        {:else}
                          {"(" + item._type + ") " + item.name}
                        {/if}
                      {/snippet}
                    </Entityselector>
                    <HotkeyButton
                      aria-label="User Details"
                      disabled={!Boolean($formData.runas) || loading}
                      onclick={() => {
                        goto(base + `/user/${$formData.runas}`);
                      }}><User />User Details</HotkeyButton
                    >
                  </div>
                {:else}
                  <div class="md:flex md:items-center md:space-x-4 my-2">
                    <Entityselector
                      name="Access Token"
                      propertyname="_id"
                      queryas={usersettings.currentworkspace}
                      width="md:w-fit w-64"
                      class="mb-4 md:mb-0"
                      disabled={loading}
                      collectionname="usertokens"
                      basefilter={{ _type: "usertoken", revoked: false }}
                      bind:value={$formData.runas}
                    >
                      {#snippet rendername(item: any)}
                        ({item._userdisplayname}) {item.name}
                      {/snippet}
                      {#snippet rendercontent(item: any)}
                        {#if item == null}
                          Nothing selected
                        {:else}
                          ({item._userdisplayname}) {item.name}
                        {/if}
                      {/snippet}
                    </Entityselector>
                    <HotkeyButton
                      aria-label="User Details"
                      disabled={!Boolean($formData.runas) || loading}
                      onclick={gotoTokenUser}><User />User Details</HotkeyButton
                    >
                  </div>
                {/if}
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="volumes" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Volumes</Form.Label>
                <Entityselector
                  propertyname="_id"
                  queryas={usersettings.currentworkspace}
                  width="md:w-fit w-64"
                  class="mb-4 md:mb-0"
                  disabled={loading}
                  {...props}
                  collectionname="sf"
                  basefilter={{ _type: "volume" }}
                  bind:value={$formData.volumes}
                  selectiontype="multiple"
                  maxselections={4}
                >
                  {#snippet rendername(item: any)}
                    {"(" + item._type + ") " + item.name}
                  {/snippet}
                  {#snippet rendercontent(item: any)}
                    {#if item == null}
                      Nothing selected
                    {:else}
                      {"(" + item._type + ") " + item.name}
                    {/if}
                  {/snippet}
                </Entityselector>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <HotkeyButton
            type="submit"
            disabled={loading}
            aria-label="Update SF Function"
            variant="success"
            size="base"
            data-shortcut="ctrl+s"
          >
            <Check />
            Update Serverless</HotkeyButton
          >
        </form>
      {:else}
        <div>Data not found or access denied</div>
      {/if}
    </Tabs.Content>
  {/if}

  <Tabs.Content value="2" class="mt-6">
    <div class="flex items-center gap-4 mb-4">
      {@render DurationSelect({ onChange: getInstanceLogs })}
      {@render ReloadData({ onChange: getInstanceLogs })}
    </div>
    <div class="grid grid-cols-3 gap-4 mb-4">
      <CustomGraph title="Run Time" bind:data={gdruntime} />
      <CustomGraph title="Boot Time" bind:data={gdboottime} />
      <CustomGraph title="Response Time" bind:data={gdappresponsetime} />
    </div>
    {@render LogsTable({
      rows: tdInstanceLog.map((row) => ({ ...row, tag: row.metadata?.tag })),
      cols:
        tdInstanceLog.length > 0
          ? [
              "ts",
              "tag",
              ...Object.keys(tdInstanceLog[0]).filter(
                (k) =>
                  k !== "ts" &&
                  k !== "tag" &&
                  k !== "time" &&
                  !excludedcols.includes(k),
              ),
            ]
          : [],
    })}
  </Tabs.Content>
  <Tabs.Content value="3" class="mt-6">
    <div class="flex items-center gap-4 mb-4">
      {@render DurationSelect({ onChange: getRequestLogs })}
      {@render ReloadData({ onChange: getRequestLogs })}
      {@render ToggleErrors({
        onChange: async () => {
          await getRequestLogs();
        },
      })}
    </div>

    <div class="grid grid-cols-3 gap-4 mb-4">
      <CustomGraph title="Response Time" bind:data={gdresponsetime} />
      <CustomGraph title="Content Size" bind:data={gdcontentsize} />
      <!-- <CustomGraph
        title="Num Req Per Status Code"
        bind:chartdata={gdnumrequest}
      /> -->
    </div>

    {@render LogsTable({
      rows: tdRequestLog.map((row) => ({ ...row, tag: row.metadata?.tag })),
      cols:
        tdRequestLog.length > 0
          ? [
              "ts",
              "tag",
              ...Object.keys(tdRequestLog[0]).filter(
                (k) =>
                  k !== "ts" &&
                  k !== "tag" &&
                  k !== "time" &&
                  !excludedcols.includes(k),
              ),
            ]
          : [],
    })}
  </Tabs.Content>
  <Tabs.Content value="4" class="mt-6">
    <div class="flex items-center gap-4 mb-4">
      {@render DurationSelect({ onChange: getConsoleLogs })}
      {@render ReloadData({ onChange: getConsoleLogs })}
      {@render ToggleErrors({
        onChange: async () => {
          await getConsoleLogs();
        },
      })}
    </div>

    <!-- <div class="grid grid-cols-3 gap-4 mb-4">
      <CustomGraph title="Messages" bind:data={gdmessages} />
    </div> -->

    {@render LogsTable({
      rows: tdConsoleLog,
      cols: ["ts", "vmid", "message"],
      headClassFor: (col: string) => {
        const k = col?.toLowerCase?.() ?? "";
        if (isTimeLikeColumn(k)) {
          return "whitespace-nowrap w-0"; // compact
        }
        if (k === "message" || k === "msg" || k === "log") {
          return "w-full"; // expand
        }
        return "";
      },
      cellClassFor: (col: string, _val: any) => {
        const k = col?.toLowerCase?.() ?? "";
        if (isTimeLikeColumn(k)) {
          return "pr-3 whitespace-nowrap align-top text-muted-foreground"; // minimal width
        }
        if (k === "message" || k === "msg" || k === "log") {
          return "w-full whitespace-pre-wrap break-words align-top"; // take remaining width
        }
        return "";
      },
    })}
  </Tabs.Content>
</Tabs.Root>

<CustomSuperDebug formData={getSuperDebugData()} />
