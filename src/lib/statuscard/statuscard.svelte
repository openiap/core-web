<script lang="ts">
    let { title = $bindable("") } = $props();
    let bgcolor = "";
    title = title.toLowerCase();
    function renderClass() {
        switch (title) {
            case "running":
                bgcolor = " bg-green-200 dark:bg-green-600 dark:text-white";
                break;
            case "stopped":
                bgcolor = " bg-red-200 dark:bg-red-600 dark:text-white";
                break;
            case "unknown":
                bgcolor = " bg-purple-200 dark:bg-purple-600 dark:text-white";
                break;
            case "missing":
                bgcolor = " bg-purple-200 dark:bg-purple-600 dark:text-white";
                break;
            case "online":
                bgcolor = " bg-yellow-200 dark:bg-yellow-600 dark:text-white";
                break;
            case "deleting":
                bgcolor = " bg-orange-200 dark:bg-orange-600 dark:text-white";
                break;
            default:
                // console.log("title", title);
                // bgcolor = "bg-gray-200 dark:bg-gray-600 dark:text-white";
                break;
        }
        return (
            `text-center rounded rounded-full px-2.5 py-1.5 text-black max-w-20 flex justify-center items-center text-sm ` +
            bgcolor
        );
    }
    function capitalizeFirstLetter(str: any) {
        if (!str) return ""; // Handle empty strings
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
</script>

<div class={renderClass()}>
    {capitalizeFirstLetter(title)}
</div>
