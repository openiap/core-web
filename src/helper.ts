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

function _timeSince(timeStamp: Date) {
	timeStamp = new Date(timeStamp);
	const now: Date = new Date(),
		secondsPast: number = (now.getTime() - timeStamp.getTime()) / 1000;
	if (secondsPast < 60) {
		return parseInt(secondsPast.toString()) + "s";
	}
	if (secondsPast < 3600) {
		return parseInt((secondsPast / 60).toString()) + "m";
	}
	if (secondsPast <= 86400) {
		return (
			parseInt((secondsPast / 3600).toString()) +
			"h" +
			" " +
			parseInt(((secondsPast % 3600) / 60).toString()) +
			"m"
		);
	}
	if (secondsPast > 86400) {
		let day = timeStamp.getDate();
		// @ts-ignore
		let month = timeStamp
			?.toDateString()
			.match(/ [a-zA-Z]*/)[0]
			.replace(" ", "");
		let year =
			timeStamp.getFullYear() == now.getFullYear()
				? ""
				: " " + timeStamp.getFullYear();
		let hour = timeStamp.getHours();
		if (hour < 10) {
			hour = ("0" + hour) as any
		}
		let minute = timeStamp.getMinutes();
		if (minute < 10) {
			minute = ("0" + minute) as any;
		}
		return day + " " + month + year + " " + hour + ":" + minute;
	}
}

const responsiveTestClass = " bg-white sm:bg-red-500 md:bg-yellow-500 lg:bg-green-500 xl:bg-blue-500 "

export { capitalizeFirstLetter, capitalizeWords, responsiveTestClass, _timeSince };