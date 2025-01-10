<script lang="ts">
    let { title = $bindable("") } = $props();
    let bgcolor = "";
    title = title.toLowerCase();
    function renderClass() {
        switch (title) {
            case "running":
                bgcolor =
                    "bg-green-200 dark:bg-darkbggreen dark:text-darktextgreen border-[1px] border-darkbordergreen";
                break;
            case "stopped":
                bgcolor =
                    "bg-red-200 dark:bg-darkbgred dark:text-darktextred border-[1px] border-darkborderred";
                break;
            case "unknown":
                bgcolor =
                    " bg-purple-200 dark:bg-darkbgpurple dark:text-darktextpurple border-[1px] border-darkborderpurple";
                break;
            case "missing":
                bgcolor =
                    " bg-purple-200 dark:bg-darkbgpurple dark:text-darktextpurple border-[1px] border-darkborderpurple";
                break;
            case "online":
                bgcolor =
                    "bg-yellow-200 dark:bg-darkbgyellow dark:text-darktextyellow border-[1px] border-darkborderyellow";
                break;
            case "deleting":
                bgcolor = "bg-orange-200 dark:bg-darkbgorange dark:text-darktextorange border-[1px] border-darkborderorange";
                break;
            default:
                break;
        }
        return (
            `flex justify-center items-center text-center rounded rounded-full px-2 text-black max-w-20 text-sm ` +
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
