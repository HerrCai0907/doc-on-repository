const eventSource = new EventSource("/updates");

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (window.location.href.slice(window.location.origin.length) === data.path) {
    // window.location.href = window.location.href;
    const url = new URL(window.location.href);
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, "text/html");
        document.head.innerHTML = newDoc.head.innerHTML;
        document.body.innerHTML = newDoc.body.innerHTML;
      })
      .catch((error) => console.error("error fetching page:", error));
  }
};
