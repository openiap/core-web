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
  import EntitySelector from "$lib/entityselector/entityselector.svelte";
  import { ObjectInput } from "$lib/objectinput/index.js";
  import { auth } from "$lib/stores/auth.svelte.js";
  import { usersettings } from "$lib/stores/usersettings.svelte.js";
  import { Check, RotateCcw, User, Webhook } from "lucide-svelte";
  import { tick } from "svelte";
  import { toast } from "svelte-sonner";
  import { defaults, superForm } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  import { _timeSince } from "../../../helper";
  import { editFormSchemaAdmin, editFormSchemaUser } from "../schema.js";

  let profileroles = auth.profile?.roles || [];
  const isAdmin = profileroles.includes("admins");

  const { data } = $props();

  if (data.item != null) {
    if (data.item.anonymous == null) {
      data.item.anonymous = false;
    }
    data.item = (isAdmin ? editFormSchemaAdmin : editFormSchemaUser).parse(
      data.item,
    );
  }

  // let amqpqueuedata = $state(data.amqpqueuedata);

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
    { label: "Last 90 days", value: "90d" },
    { label: "Last 180 days", value: "180d" },
    { label: "Last 1 year", value: "365d" },
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
  let _gdruntime = $state<Float64Array[]>([]);
  let gdruntime_series = $state<Array<any>>([]);
  let gdruntime_title = $state<string>("");

  let gdappresponsetime = $state<Float64Array[]>([]);
  let _gdappresponsetime = $state<Float64Array[]>([]);
  let gdappresponsetime_series = $state<Array<any>>([]);
  let gdappresponsetime_title = $state<string>("");

  let gdboottime = $state<Float64Array[]>([]);
  let _gdboottime = $state<Float64Array[]>([]);
  let gdboottime_series = $state<Array<any>>([]);
  let gdboottime_title = $state<string>("");

  // Request log
  let gdresponsetime = $state<Float64Array[]>([]);
  let _gdresponsetime = $state<Float64Array[]>([]);
  let gdresponsetime_series = $state<Array<any>>([]);
  let gdresponsetime_title = $state<string>("");

  let gdcontentsize = $state<Float64Array[]>([]);
  let _gdcontentsize = $state<Float64Array[]>([]);
  let gdcontentsize_series = $state<Array<any>>([]);
  let gdcontentsize_title = $state<string>("");

  let gdnumrequest = $state<Float64Array[]>([]);
  let _gdnumrequest = $state<Float64Array[]>([]);
  let gdnumrequest_series = $state<Array<any>>([]);
  let gdnumrequest_title = $state<string>("");

  let selectedtab = $state(0);
  //  Console log
  let gdmessages = $state<Float64Array[]>([]);
  let _gdmessages = $state<Float64Array[]>([]);
  let gdmessages_series = $state<Array<any>>([]);
  let gdmessages_title = $state<string>("");

  let showerror = $state(false);
  let forcereload = $state(true);

  const excludedcols = ["_id", "metadata", "ts", "userid"];

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
            if (form.data.relay_headers == false) {
              // @ts-ignore
              delete form.data.relay_headers;
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
              command: "ensuresfapp",
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
    getRequestLogs();
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
      if (currentHash !== newHash || forcereload) {
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
      if (currentHash !== newHash || forcereload) {
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
      if (currentHash !== newHash || forcereload) {
        tdConsoleLog = newTdConsoleLog;
      }
      await getGDConsoleLog();
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

    // to stop the graph from changing due to sliding buckets
    end.setSeconds(0, 0);
    start.setSeconds(0, 0);

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

  function isoStrToEpoch(isoStr: string) {
    // Convert ISO string to epoch time in seconds
    const date = new Date(isoStr);
    return Math.floor(date.getTime() / 1000); // Convert ms to seconds
  }

  function transformValue(
    datatype: "ms" | "bytes" | "number" | "percent" | "default" = "default",
    value: any,
    addPrefix: boolean,
    aggregateData: Array<any>,
  ): any {
    try {
      if (value == null || value === undefined) {
        return null; // Handle null or undefined values
      }
      const maxValue = Math.max(...aggregateData.map((item) => item.value));

      value = Number(value); // Ensure value is a number
      const _value = Number(maxValue);
      if (datatype === "ms") {
        if (_value >= 31536000000) {
          value = _value / 31536000000; // Convert ms to years
        } else if (_value >= 604800000) {
          value = _value / 604800000; // Convert ms to weeks
        } else if (_value >= 86400000) {
          value = _value / 86400000; // Convert ms to days
        } else if (_value >= 3600000) {
          value = _value / 3600000; // Convert ms to hours
        } else if (_value >= 60000) {
          value = _value / 60000; // Convert ms to minutes
        } else if (_value >= 1000) {
          value = _value / 1000; // Convert ms to seconds
        } else {
          value = _value; // Already ms
        }
        if (addPrefix) {
          if (_value >= 31536000000) {
            return value.toFixed(2) + " years";
          } else if (_value >= 604800000) {
            return value.toFixed(2) + " weeks";
          } else if (_value >= 86400000) {
            return value.toFixed(2) + " days";
          } else if (_value >= 3600000) {
            return value.toFixed(2) + " hours";
          } else if (_value >= 60000) {
            return value.toFixed(2) + " min";
          } else if (_value >= 1000) {
            return value.toFixed(2) + " sec";
          } else {
            return value.toFixed(2) + " ms";
          }
        } else {
          return value.toFixed(2);
        }
      } else if (datatype === "bytes") {
        if (_value >= 1073741824) {
          value = _value / 1073741824; // Convert B to GB
        } else if (_value >= 1048576) {
          value = _value / 1048576; // Convert B to MB
        } else if (_value >= 1024) {
          value = _value / 1024; // Convert B to KB
        } else {
          value = _value; // Already in Bytes
        }

        if (addPrefix) {
          if (_value >= 1073741824) {
            return (_value / 1073741824).toFixed(2) + " GB";
          } else if (_value >= 1048576) {
            return (_value / 1048576).toFixed(2) + " MB";
          } else if (_value >= 1024) {
            return (_value / 1024).toFixed(2) + " KB";
          } else {
            return _value.toFixed(2) + " Bytes";
          }
        } else {
          return value.toFixed(2);
        }
      } else if (datatype === "number") {
        if (_value >= 1_000_000_000) {
          value = _value / 1_000_000_000; // Convert to Billions
        } else if (_value >= 1_000_000) {
          value = _value / 1_000_000; // Convert to Millions
        } else if (_value >= 1_000) {
          value = _value / 1_000; // Convert to Thousands
        } else {
          value = _value; // Less than 1000, keep as is
        }

        if (addPrefix) {
          if (_value >= 1_000_000_000) {
            return (_value / 1_000_000_000).toFixed(2) + " B";
          } else if (_value >= 1_000_000) {
            return (_value / 1_000_000).toFixed(2) + " M";
          } else if (_value >= 1_000) {
            return (_value / 1_000).toFixed(2) + " K";
          } else {
            return _value.toFixed(2);
          }
        } else {
          return value.toFixed(2);
        }
      } else if (datatype === "percent") {
        if (addPrefix) {
          return value == null ? null : value.toFixed(2) + " %";
        } else {
          return value == null ? null : value.toFixed(2);
        }
      } else {
        return value.toFixed(2);
      }
    } catch (error: any) {
      console.error("Error in transformValue:", error);
      return null; // Return null if there's an error
    }
  }

  function transformAggregateDataToChart(
    aggregateData: any[],
    startTime: string,
    endTime: string,
    datatype: "ms" | "bytes" | "number" | "percent" | "default" = "default",
  ): { graphdata: any[]; legendnames: string[] } {
    let result: any[] = [];
    let results: any[] = [];
    let legendnames = [];

    // Collect unique timestamps and legend names
    for (let i = 0; i < aggregateData.length; i++) {
      const item = aggregateData[i];
      if (result.indexOf(item.ts) == -1) {
        result.push(item.ts);
      }
      if (legendnames.indexOf(item.name) == -1) {
        legendnames.push(item.name);
      }
    }

    // Initialize results arrays
    results.push([]); // First array for timestamps
    for (let j = 0; j < legendnames.length; j++) {
      results.push([]); // One array per legend
    }

    // Add start time
    results[0]?.push(isoStrToEpoch(startTime));
    for (let j = 0; j < legendnames.length; j++) {
      results[j + 1].push(undefined);
    }
    // Process data points
    for (let i = 0; i < result.length; i++) {
      results[0]?.push(isoStrToEpoch(result[i]));
      let subresult = aggregateData.filter((item) => item.ts === result[i]);

      for (let j = 0; j < legendnames.length; j++) {
        let subitem = subresult.find((item) => item.name === legendnames[j]);
        if (subitem) {
          results[j + 1].push(
            transformValue(datatype, subitem.value, false, aggregateData),
          );
        } else {
          results[j + 1].push(undefined);
        }
      }
    }

    // Add end time
    results[0].push(isoStrToEpoch(endTime));
    for (let j = 0; j < legendnames.length; j++) {
      results[j + 1].push(undefined);
    }
    return { graphdata: results, legendnames };
  }

  function getGraphTitle(datatype: string, aggregateData: any[]) {
    try {
      const maxValue = Math.max(...aggregateData.map((item) => item.value));
      const _value = Number(maxValue);
      if (datatype === "ms") {
        if (_value >= 31536000000) {
          return " (Years)";
        } else if (_value >= 604800000) {
          return " (Weeks)";
        } else if (_value >= 86400000) {
          return " (Days)";
        } else if (_value >= 3600000) {
          return " (Hours)";
        } else if (_value >= 60000) {
          return " (Minutes)";
        } else if (_value >= 1000) {
          return " (Seconds)";
        } else {
          return " (Milliseconds)";
        }
      } else if (datatype === "bytes") {
        if (_value >= 1073741824) {
          return " (Giga Bytes)";
        } else if (_value >= 1048576) {
          return " (Mega Bytes)";
        } else if (_value >= 1024) {
          return " (Kilo Bytes)";
        } else {
          return " (Bytes)";
        }
      } else if (datatype === "number") {
        if (_value >= 1_000_000_000) {
          return " (Billions)";
        } else if (_value >= 1_000_000) {
          return " (Millions)";
        } else if (_value >= 1_000) {
          return " (Thousands)";
        } else {
          return " (Units)";
        }
      } else if (datatype === "percent") {
        return " (Percent)";
      } else {
        return "";
      }
    } catch (error: any) {
      console.error("Error in transformValue:", error);
      return ""; // Return null if there's an error
    }
  }

  async function getGDInstanceLog() {
    try {
      const { start: starttime, end: endtime } =
        getTimeDuration(selectedduration);
      let intervalMs = 1; // default to 1 minute
      const gdruntime_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$metadata.host",
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              metadata_host: "$metadata.host",
            },
            value: {
              $avg: "$run_time",
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdruntime_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      let gdruntime_res = await auth.client.Aggregate<any>({
        collectionname: "sf_instance_logs",
        aggregates: gdruntime_agg,
        jwt: auth.access_token,
      });
      if (gdruntime_res.length > 0) {
        const currentHash = JSON.stringify(_gdruntime);
        const newHash = JSON.stringify(gdruntime_res);
        if (currentHash !== newHash || forcereload) {
          gdruntime_title = getGraphTitle("ms", gdruntime_res);
          _gdruntime = gdruntime_res;
          const results = transformAggregateDataToChart(
            gdruntime_res,
            starttime,
            endtime,
            "ms",
          );
          gdruntime = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdruntime_res.map((item: any) => item.value),
          // );
          gdruntime_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("ms", v, true, gdruntime_res);
              },
            };
          });
        }
      } else {
        gdruntime = [];
        _gdruntime = [];
      }

      let gdboottime_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$metadata.host",
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              metadata_host: "$metadata.host",
            },
            value: {
              $avg: "$boot_time",
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdboottime_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      let gdboottime_res = await auth.client.Aggregate<any>({
        collectionname: "sf_instance_logs",
        aggregates: gdboottime_agg,
        jwt: auth.access_token,
      });
      if (gdboottime_res.length > 0) {
        const currentHash = JSON.stringify(_gdboottime);
        const newHash = JSON.stringify(gdboottime_res);
        if (currentHash !== newHash || forcereload) {
          gdboottime_title = getGraphTitle("ms", gdboottime_res);
          _gdboottime = gdboottime_res;
          const results = transformAggregateDataToChart(
            gdboottime_res,
            starttime,
            endtime,
            "ms",
          );
          gdboottime = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdboottime.map((item: any) => item.value),
          // );
          gdboottime_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("ms", v, true, gdboottime_res);
              },
            };
          });
        }
      }

      let gdappresponsetime_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$metadata.host",
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              metadata_host: "$metadata.host",
            },
            value: {
              $avg: "$app_response_time",
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdappresponsetime_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      let gdappresponsetime_res = await auth.client.Aggregate<any>({
        collectionname: "sf_instance_logs",
        aggregates: gdappresponsetime_agg,
        jwt: auth.access_token,
      });
      if (gdappresponsetime_res.length > 0) {
        const currentHash = JSON.stringify(_gdappresponsetime);
        const newHash = JSON.stringify(gdappresponsetime_res);
        if (currentHash !== newHash || forcereload) {
          gdappresponsetime_title = getGraphTitle("ms", gdappresponsetime_res);
          _gdappresponsetime = gdappresponsetime_res;
          const results = transformAggregateDataToChart(
            gdappresponsetime_res,
            starttime,
            endtime,
            "ms",
          );
          gdappresponsetime = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdappresponsetime.map((item: any) => item.value),
          // );
          gdappresponsetime_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("ms", v, true, gdappresponsetime_res);
              },
            };
          });
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
    const { start: starttime, end: endtime } =
      getTimeDuration(selectedduration);
    try {
      const intervalMs = 60000;
      let gdresponsetime_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$metadata.host",
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              metadata_host: "$metadata.host",
            },
            value: {
              $avg: "$cold_response_time",
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
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
      let gdresponsetime_res = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdresponsetime_agg,
        jwt: auth.access_token,
      });
      if (gdresponsetime_res.length > 0) {
        const currentHash = JSON.stringify(_gdresponsetime);
        const newHash = JSON.stringify(gdresponsetime_res);
        if (currentHash !== newHash || forcereload) {
          gdresponsetime_title = getGraphTitle("ms", gdresponsetime_res);
          _gdresponsetime = gdresponsetime_res;
          const results = transformAggregateDataToChart(
            gdresponsetime_res,
            starttime,
            endtime,
            "ms",
          );
          gdresponsetime = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdresponsetime.map((item: any) => item.value),
          // );
          gdresponsetime_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("ms", v, true, gdresponsetime_res);
              },
            };
          });
        }
      } else {
        gdresponsetime = [];
        _gdresponsetime = [];
      }

      let gdcontentsize_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$metadata.host",
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              length: "$length",
              metadata_host: "$metadata.host",
            },
            value: {
              $sum: "$bytes_received",
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
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
      let gdcontentsize_res = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdcontentsize_agg,
        jwt: auth.access_token,
      });
      if (gdcontentsize_res.length > 0) {
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(_gdcontentsize);
        const newHash = JSON.stringify(gdcontentsize_res);
        if (currentHash !== newHash || forcereload) {
          gdcontentsize_title = getGraphTitle("bytes", gdcontentsize_res);
          _gdcontentsize = gdcontentsize_res;
          const results = transformAggregateDataToChart(
            gdcontentsize_res,
            starttime,
            endtime,
            "bytes",
          );
          gdcontentsize = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdcontentsize.map((item: any) => item.value),
          // );
          gdcontentsize_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("bytes", v, true, gdcontentsize_res);
              },
            };
          });
        }
      } else {
        gdcontentsize = [];
        _gdcontentsize = [];
      }

      let gdnumrequest_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$code",
                },
                " ",
                {
                  $toString: "$metadata.host",
                },
                " ",
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              code: "$code",
              metadata_host: "$metadata.host",
            },
            value: {
              $sum: 1,
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
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
      let gdnumrequest_res = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdnumrequest_agg,
        jwt: auth.access_token,
      });
      if (gdnumrequest_res.length > 0) {
        // Check if the data is the same then do not rerender the graph
        const currentHash = JSON.stringify(_gdnumrequest);
        const newHash = JSON.stringify(gdnumrequest_res);
        if (currentHash !== newHash || forcereload) {
          gdnumrequest_title = getGraphTitle("number", gdnumrequest_res);
          _gdnumrequest = gdnumrequest_res;
          const results = transformAggregateDataToChart(
            gdnumrequest_res,
            starttime,
            endtime,
            "number",
          );
          gdnumrequest = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdnumrequest.map((item: any) => item.value),
          // );
          gdnumrequest_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("number", v, true, gdnumrequest_res);
              },
            };
          });
        }
      } else {
        gdnumrequest = [];
        _gdnumrequest = [];
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
      const { start: starttime, end: endtime } =
        getTimeDuration(selectedduration);
      const intervalMs = 2000; // default to 1 second
      // here i want to count the messages and add it to the chart
      let gdmessages_agg = [
        {
          $match: {
            ts: { $gte: new Date(starttime), $lt: new Date(endtime) },
          },
        },
        {
          $addFields: {
            __labelfield: {
              $concat: [
                {
                  $toString: "$metadata.host",
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              dt: {
                $subtract: [
                  {
                    $subtract: ["$ts", endtime],
                  },
                  {
                    $mod: [
                      {
                        $subtract: ["$ts", endtime],
                      },
                      intervalMs,
                    ],
                  },
                ],
              },
              metadata_host: "$metadata.host",
            },
            value: {
              $sum: 1,
            },
            ts: {
              $max: "$ts",
            },
            name: {
              $max: "$__labelfield",
            },
          },
        },
        {
          $sort: {
            ts: 1,
          },
        },
      ];
      if (data.paramid != "null") {
        // @ts-ignore
        gdmessages_agg[0].$match["metadata.repo"] = data.item.repo;
      }
      if (showerror == true) {
        // @ts-ignore
        gdmessages_agg[0].$match["err"] = { $eq: true };
      }
      let gdmessages_res = await auth.client.Aggregate<any>({
        collectionname: "sf_request_logs",
        aggregates: gdmessages_agg,
        jwt: auth.access_token,
      });
      if (gdmessages_res.length > 0) {
        const currentHash = JSON.stringify(_gdmessages);
        const newHash = JSON.stringify(gdmessages_res);
        if (currentHash !== newHash || forcereload) {
          _gdmessages = gdmessages_res;
          const results = transformAggregateDataToChart(
            gdmessages_res,
            starttime,
            endtime,
            "default",
          );
          gdmessages = results.graphdata;
          // const maxValue = Math.max(
          //   ...gdmessages.map((item: any) => item.value),
          // );
          gdmessages_series = results.legendnames.map((name) => {
            return {
              label: name,
              value: (u: any, v: any) => {
                return v == null
                  ? null
                  : transformValue("default", v, true, gdmessages_res);
              },
            };
          });
        }
      } else {
        gdmessages = [];
        _gdmessages = [];
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
    {loading}
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
          // toast.success("Data reloaded successfully");
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
      {loading}
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

<Tabs.Root value={data.paramid != "null" ? "1" : "3"} class="w-full">
  <div class="flex items-center gap-4">
    <Tabs.List
      class="h-fit grid grid-cols-1 md:block w-full md:w-fit bg-bw200 dark:bg-darkagenttab rounded-[15px] p-1 mb-10 lg:mb-0"
    >
      {#if data.paramid != "null"}
        <Tabs.Trigger value="1" onclick={() => (selectedtab = 0)}
          >Settings</Tabs.Trigger
        >
      {/if}
      <Tabs.Trigger value="3" onclick={getRequestLogs}>Request Log</Tabs.Trigger
      >
      <Tabs.Trigger value="2" onclick={getInstanceLogs}
        >Instance Log</Tabs.Trigger
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
                <EntitySelector
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
                </EntitySelector>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="repo" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Repository Name</Form.Label>
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
                <Form.Label>Distribution</Form.Label>
                <EntitySelector
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
                </EntitySelector>
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
                <Form.Label>Min Instances</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type Min Instances"
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
                <Form.Label>Max Instances</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type Max Instances"
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
                <Form.Label>Minimum Response Time (Milliseconds)</Form.Label>
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

          <Form.Field {form} name="idle_timeout" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Idle Timeout (Milliseconds)</Form.Label>
                <CustomInput
                  type="number"
                  placeholder="Type Idle Timeout"
                  disabled={loading}
                  {...props}
                  bind:value={$formData.idle_timeout}
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
                    <EntitySelector
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
                    </EntitySelector>
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
                    <EntitySelector
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
                    </EntitySelector>
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
                <EntitySelector
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
                </EntitySelector>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="relay_headers" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-row items-center space-x-2 py-4">
                  <Form.Label>Relay Headers</Form.Label>
                  <CustomSwitch
                    disabled={loading}
                    {...props}
                    bind:checked={$formData.relay_headers}
                  />
                </div>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="register_queue" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-row items-center space-x-2 py-4">
                  <Form.Label>Register Queue</Form.Label>
                  <CustomSwitch
                    disabled={loading}
                    {...props}
                    bind:checked={$formData.register_queue}
                  />
                </div>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="non_web" class="mb-10">
            <Form.Control>
              {#snippet children({ props })}
                <div class="flex flex-row items-center space-x-2 py-4">
                  <Form.Label>Non-Web</Form.Label>
                  <CustomSwitch
                    disabled={loading}
                    {...props}
                    bind:checked={$formData.non_web}
                  />
                </div>
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <div class="mb-10">
            <div class="mb-2 font-medium text-sm">AMQP Queue</div>
            <EntitySelector
              {loading}
              collectionname="mq"
              bind:value={$formData.amqpqueue}
              basefilter={{ _type: "queue" }}
              projection={{ name: 1, _type: 1 }}
              class="w-64"
              name="amqpqueue"
              allowunselect={true}
              handleChangeFunction={(value: any, item: any) => {
                if (item == null) {
                  $formData.amqpqueue = "";
                }
              }}
              propertyname="name"
              >{#snippet rendername(item: any)}
                {item.name}
              {/snippet}
              {#snippet rendercontent(item: any)}
                {#if item == null}
                  Select a queue
                {:else}
                  {item.name}
                {/if}
              {/snippet}
            </EntitySelector>
          </div>

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
      <CustomGraph
        title={"Run Time" + gdruntime_title}
        bind:data={gdruntime}
        series={gdruntime_series}
      />
      <CustomGraph
        title={"Response Time" + gdappresponsetime_title}
        bind:data={gdappresponsetime}
        series={gdappresponsetime_series}
      />
      <CustomGraph
        title={"Boot Time" + gdboottime_title}
        bind:data={gdboottime}
        series={gdboottime_series}
      />
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
      <CustomGraph
        title={"Response Time" + gdresponsetime_title}
        bind:data={gdresponsetime}
        series={gdresponsetime_series}
      />
      <CustomGraph
        title={"Content Size" + gdcontentsize_title}
        bind:data={gdcontentsize}
        series={gdcontentsize_series}
      />
      <CustomGraph
        title={"Num Req Per Status Code" + gdnumrequest_title}
        bind:data={gdnumrequest}
        series={gdnumrequest_series}
      />
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

    <div class="grid grid-cols-1 gap-4 mb-4">
      <CustomGraph
        bind:data={gdmessages}
        series={gdmessages_series}
        showlegend={false}
        chartsize="sm"
      />
    </div>

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
