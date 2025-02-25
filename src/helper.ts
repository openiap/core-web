function capitalizeFirstLetter(str: any) {
    if (!str) return ""; // Handle empty strings
    if (str === "stopped crashloopbackoff") {
        return (str = "Stopped CLB");
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str: any) {
    return str
        .split(" ")
        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

const responsiveTestClass = " bg-white sm:bg-red-500 md:bg-yellow=500 lg:bg-green-500 xl:bg-blue-500 "

export { capitalizeFirstLetter, capitalizeWords, responsiveTestClass };