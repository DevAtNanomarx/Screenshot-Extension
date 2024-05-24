chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "start-screenshot-capture") {
		startScreenshotCapture();
	} else if (message.type === "process-screenshot") {
		const { dataUrl, x, y, width, height } = message;

		const canvas = document.createElement("canvas");
		const img = new Image();
		img.src = dataUrl;

		img.onload = () => {
			const context = canvas.getContext("2d");
			canvas.width = width;
			canvas.height = height;
			context.drawImage(img, x, y, width, height, 0, 0, width, height);
			const croppedDataUrl = canvas.toDataURL("image/png");
			downloadDataUrl(croppedDataUrl, "screenshot.png");
		};
	}
});

function startScreenshotCapture() {
	const overlay = createOverlay();
	document.body.appendChild(overlay);

	let startX, startY, selectionBox, actualHeight, actualWidth;

	document.body.style.cursor = "crosshair";
	document.addEventListener("mousedown", onMouseDown);
	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);

	function onMouseDown(event) {
		startX = event.pageX;
		startY = event.pageY;
		selectionBox = createSelectionBox(startX, startY);
		overlay.appendChild(selectionBox);
	}

	function onMouseMove(event) {
		if (!selectionBox) return;
		const endX = event.pageX;
		const endY = event.pageY;
		updateSelectionBox(selectionBox, startX, startY, endX, endY);
		console.log({
			height: selectionBox.clientHeight,
			width: selectionBox.clientWidth,
		});
		actualHeight = selectionBox.clientHeight;
		actualWidth = selectionBox.clientWidth;
	}

	function onMouseUp(event) {
		document.body.style.cursor = "default";
		const endX = event.pageX;
		const endY = event.pageY;
		const rect = selectionBox.getBoundingClientRect();
		const devicePixelRatio = window.devicePixelRatio || 1;
		const pageZoom =
			document.documentElement.clientWidth / window.innerWidth;

		document.removeEventListener("mousedown", onMouseDown);
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		document.body.removeChild(overlay);

		// Calculate the width and height using the end coordinates
		const width = Math.abs(endX - startX) * devicePixelRatio * pageZoom;
		const height = Math.abs(endY - startY) * devicePixelRatio * pageZoom;

		// Calculate the left and top coordinates of the selection box relative to the viewport
		const left = rect.left + Math.min(startX, endX) - window.pageXOffset;
		const top = rect.top + Math.min(startY, endY) - window.pageYOffset;

		captureScreenshot(left, top, width, height);
	}

	function captureScreenshot(x, y, width, height) {
		chrome.runtime.sendMessage({
			type: "capture-screenshot",
			x: Math.round(x),
			y: Math.round(y),
			width: Math.round(width),
			height: Math.round(height),
		});
	}
}

function createOverlay() {
	const overlay = document.createElement("div");
	overlay.style.position = "fixed";
	overlay.style.top = 0;
	overlay.style.left = 0;
	overlay.style.width = "100%";
	overlay.style.height = "100%";
	overlay.style.backgroundColor = "rgba(128, 128, 128, 0.2)"; // Gray color with low opacity
	overlay.style.zIndex = 9999;
	overlay.style.cursor = "crosshair";

	return overlay;
}

function createSelectionBox(x, y) {
	const box = document.createElement("div");
	box.style.position = "absolute";
	box.style.border = "2px dashed #fff";
	box.style.backgroundColor = "rgba(255, 255, 255, 0)"; // Fully transparent
	box.style.left = `${x}px`;
	box.style.top = `${y}px`;
	box.style.zIndex = 10000;

	return box;
}

function updateSelectionBox(box, startX, startY, endX, endY) {
	const x = Math.min(startX, endX);
	const y = Math.min(startY, endY);
	const width = Math.abs(startX - endX);
	const height = Math.abs(startY - endY);

	box.style.left = `${x}px`;
	box.style.top = `${y}px`;
	box.style.width = `${width}px`;
	box.style.height = `${height}px`;
}

function downloadDataUrl(dataUrl, filename) {
	if (!window.downloadFlag) {
		window.downloadFlag = true;
		const a = document.createElement("a");
		a.href = dataUrl;
		a.download = filename;
		a.click();
		setTimeout(() => {
			window.downloadFlag = false;
		}, 1000); // Reset the flag after 1 second
	}
}
