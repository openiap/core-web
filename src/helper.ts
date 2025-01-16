function capitalizeFirstLetter(str: any) {
    if (!str) return ""; // Handle empty strings
    if (str === "stopped crashloopbackoff") {
        return (str = "Stopped CLB");
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export { capitalizeFirstLetter };