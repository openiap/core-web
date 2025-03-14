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
        switch (title.toLowerCase()) {
            case "stopped":
            case "stopped crashloopbackoff":
            case "application":
            case "business":
            case "failed":
                bgcolor = red;
                break;
            case "online":
                bgcolor = yellow;
                break;
            case "deleting":
            case "pending":
            case "new":
                bgcolor = orange;
                break;
            case "No error":
            case "running":
            case "successful":
            case "completed":
                bgcolor = green;
                break;
            case "unknown":
            case "missing":
            default:
                bgcolor = purple;
                break;
        }
        return (
            `flex justify-center items-center text-center rounded rounded-full px-2 w-fit text-black h-5 ` +
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
