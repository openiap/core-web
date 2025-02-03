<script lang="ts">
    let { title = $bindable("") } = $props();
    let bgcolor = "";
    title = title.toLowerCase();
    const colors = {
        red: "bg-lightbgred text-lighttextred border-lightborderred dark:bg-darkbgred dark:text-darktextred border-[1px] border-darkborderred",
        green: "bg-lightbggreen text-lighttextgreen border-lightbordergreen dark:bg-darkbggreen dark:text-darktextgreen border-[1px] border-darkbordergreen",
        yellow: "bg-lightbgyellow text-lighttextyellow border-lightborderyellow dark:bg-darkbgyellow dark:text-darktextyellow border-[1px] border-darkborderyellow",
        orange: "bg-orange-200 dark:bg-darkbgorange dark:text-darktextorange border-[1px] border-darkborderorange",
        purple: "bg-lightbgpurple text-lighttextpurple border-lightborderpurple dark:bg-darkbgpurple dark:text-darktextpurple border-[1px] border-darkborderpurple",
    };
    const { red, green, yellow, orange, purple } = colors;

    function renderClass() {
        switch (title) {
            case "running":
                bgcolor = green;
                break;
            case "stopped":
                bgcolor = red;
                break;
            case "stopped crashloopbackoff":
                bgcolor = red;
                break;
            case "unknown":
                bgcolor = purple;
                break;
            case "missing":
                bgcolor = purple;
                break;
            case "online":
                bgcolor = yellow;
                break;
            case "deleting":
                bgcolor = orange;
                break;
            case "pending":
                bgcolor = orange;
                break;
            case "No error":
                bgcolor = green;
                break;
            case "successful":
                bgcolor = green;
                break;
            case "failed":
                bgcolor = red;
                break;
            case "new":
                bgcolor = orange;
                break;
            case "application":
                bgcolor = red;
                break;
            case "business":
                bgcolor = red;
                break;
            default:
                bgcolor = purple;
                break;
        }
        return (
            `flex justify-center items-center text-center rounded rounded-full px-2 text-black h-5 ` +
            bgcolor
        );
    }
    function capitalizeFirstLetter(str: any) {
        if (!str) return ""; // Handle empty strings
        if (str === "stopped crashloopbackoff") {
            return (str = "Stopped CLB");
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
</script>

<div class={renderClass()} {title}>
    {capitalizeFirstLetter(title)}
</div>
