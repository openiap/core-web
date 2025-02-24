function capitalizeFirstLetter(str: any) {
    if (!str) return ""; // Handle empty strings
    if (str === "stopped crashloopbackoff") {
        return (str = "Stopped CLB");
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str: any) {
    console.log("helper str", str);
    return str
        .split(" ")
        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export { capitalizeFirstLetter, capitalizeWords };