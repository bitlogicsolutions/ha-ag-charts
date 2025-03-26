const DOM = `
<ha-card>
  <style>
    #fs {
      position: absolute;
      right: 10px;
      top: 10px;
      cursor: pointer;
    }

    .full-screen #fs {
      visibility: hidden;
    }

    #content {
      background: var(--ha-card-background,var(--card-background-color,#fff));
      display: grid;
    }
  </style>
  <div id="content">
    <div id="container"></div>
    <div id="fs">
      <svg width="20px" height="20px" viewBox="0 0 32 32" id="i-fullscreen" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
        <path d="M4 12 L4 4 12 4 M20 4 L28 4 28 12 M4 20 L4 28 12 28 M28 20 L28 28 20 28" />
      </svg>
    </div>
  </div>
</ha-card>
`;

export function setupDOM(parent: HTMLElement) {
  const { shadowRoot } = parent;

  const rootDiv = document.createElement("div");
  rootDiv.innerHTML = DOM;
  shadowRoot?.append(rootDiv);

  const contentDiv = rootDiv.querySelector("#content")!;
  const fsDiv = rootDiv.querySelector("#fs")!;
  fsDiv.addEventListener("click", () => {
    contentDiv.classList.toggle("full-screen", true);
    contentDiv.requestFullscreen({ navigationUI: "auto" });
  });
  rootDiv.addEventListener("fullscreenchange", () => {
    contentDiv.classList.toggle(
      "full-screen",
      document.fullscreenElement != null
    );
  });

  const containerDiv = rootDiv.querySelector("#container")! as HTMLElement;
  return { rootDiv, containerDiv };
}
