<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let value = "";
  export let element;
  export let description = false;
  export let c = null;
  import { id } from "./utilities.js";
  import { onMount } from "svelte";

  onMount(() => {
    if (!value) {
      value = "";
    }
    element.addEventListener("api-focus", () => {
      console.log("Got focus: ", element.id, element.innerText);
      if (document.activeElement.closest(`#${element.id}`)) {
        return;
      }
      element.focus();
      setTimeout(() => moveCursorToEnd(element));
    });
    dispatch("ready");
  });

  function moveCursorToEnd(e) {
    var t, n;
    document.createRange
      ? ((t = document.createRange()).selectNodeContents(e),
        t.collapse(!1),
        (n = window.getSelection()).removeAllRanges(),
        n.addRange(t))
      : document.selection &&
        ((t = document.body.createTextRange()).moveToElementText(e),
        t.collapse(!1),
        t.select());
  }
  function insertTab() {
    if (!window.getSelection) return;
    const e = window.getSelection();
    if (!e.rangeCount) return;
    const t = e.getRangeAt(0);
    t.collapse(!0);
    const n = document.createElement("span");
    n.appendChild(document.createTextNode("\t")),
      (n.style.whiteSpace = "pre"),
      t.insertNode(n),
      t.setStartAfter(n),
      t.collapse(!0),
      e.removeAllRanges(),
      e.addRange(t);
  }

  function change(e) {
    dispatch("change", e);
    if (e.type === "keydown") {
      if (e.key === "Backspace" && value.trim().length === 0) {
        dispatch("delete");
        e.preventDefault();
      }
      if (e.code === "Enter" && e.ctrlKey) {
        dispatch("togglecomplete");
        return;
      }
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        dispatch("description");
        return;
      }
      if (e.key === "Enter" && !description) {
        e.preventDefault();
        dispatch("newbullet");
      }
      if (e.key === "Tab") {
        if (description) {
          insertTab();
          e.preventDefault();
        } else {
          e.preventDefault();
          if (e.shiftKey) {
            dispatch("outdent");
          } else {
            dispatch("indent");
          }
        }
      }
      if (e.key === "ArrowUp") {
        dispatch("selectup");
      }
      if (e.key === "ArrowDown") {
        dispatch("selectdown");
      }
    }
  }
</script>

<span
  id={id()}
  class={c || "editable"}
  class:description
  on:keyup={change}
  on:keydown={change}
  on:input={change}
  on:change={change}
  contenteditable="true"
  bind:innerHTML={value}
  bind:this={element}
/>

<style>
  *:focus {
    outline: none;
  }
  .description:focus {
    min-height: 1.333rem;
    display: block;
  }
  .description:not(:focus) {
    white-space: nowrap;
    max-height: 1.33em;
    display: block;
    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :global(.empty .description[contenteditable]:not(:focus)) {
    height: 0 !important;
  }
</style>
