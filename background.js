chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "capture-screenshot") {
		chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
			chrome.tabs.sendMessage(sender.tab.id, {
				type: "process-screenshot",
				dataUrl: dataUrl,
				x: message.x,
				y: message.y,
				width: message.width,
				height: message.height,
			});
		});
	}
});
