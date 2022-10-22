<script>
  import ContextMenu from "./ContextMenu.svelte";
  import { id } from "./utilities.js";
  import Collapse from "./Collapse.svelte";
  import Checkbox from "./Checkbox.svelte";
  import Bullet from "./Bullet.svelte";
  import { createEventDispatcher } from "svelte";
  import E from "./Editable.svelte";
  export let item = {};
  export let isTop = false;
  export let outermost = false;
  export let container;
  let options = {
    show: false,
    item: {},
    position: {},
  };
  const dispatch = createEventDispatcher();
  import { onMount, afterUpdate } from "svelte";
  import App from "./App.svelte";
  let open = false;
  afterUpdate(() => {
    if (item.open === undefined) {
      item.open = true;
    }
    if (isTop && !item.open) {
      //Open is the non-saved version of item.open
      open = true;
    }
    if (!item.children) {
      item.children = [];
    }
    if (!item.description) {
      item.description = "";
    }
    dispatch("change", item);
  });

  function contextClicked(e) {
    let info = e.detail;
    console.log("Clicked", info);
    options.show = false;
    switch (info.id) {
      case "del":
        dispatch("delete", { id: options.item.id });
        break;
      case "complete":
        dispatch("togglecomplete", { id: options.item.id });
        break;
      case "desc":
        container
          .querySelector(
            `#item_${options.item.id} .description[contenteditable]`
          )
          .dispatchEvent(new CustomEvent("api-focus"));

        break;
      default:
        console.log(info.id, "not recognized: ", info);
        break;
    }
    options.item = {};
  }
</script>

<div class="item" bind:this={container} class:parentcompleted={item.completed}>
  {#if isTop && item.text?.length}
    <h2 class="item_title" id="item_{item.id}">
      <E
        bind:value={item.text}
        on:selectdown={(e) => {
          if (item.children?.length) {
            container
              .querySelector(`#item_${item.children[0].id} .editable`)
              .dispatchEvent(new CustomEvent("api-focus"));
          }
        }}
        on:newbullet={(e) => {
          const newItem = id();
          item.children = [
            { text: "", id: newItem, children: [], completed: false },
            ...item.children,
          ];
          setTimeout(() => {
            container
              .querySelector(`#item_${newItem} .editable`)
              .dispatchEvent(new CustomEvent("api-focus"));
          });
        }}
      />
    </h2>
  {/if}
  {#if !isTop}
    <li
      class="item"
      id="item_{item.id}"
      class:nochildren={!item.children?.length}
      class:completed={item.completed}
    >
      <div class="top">
        <div
          class="options"
          class:options_open={options.show && options.item.id === item.id}
        >
          {#if item.children?.length}<Collapse
              bind:collapsed={item.open}
              on:change={() => dispatch("change", item)}
            />
          {/if}
          <div
            class="hover"
            on:click={(e) => {
              let rect = e.target.getBoundingClientRect();
              options.position = {
                type: "fixed",
                x: rect.left,
                y: rect.top + rect.height,
              };
              options.item = item;
              console.log(options);
              options.show = true;
            }}
          >
            <svg width="32" height="32" viewBox="0 0 256 256"
              ><path
                fill="currentColor"
                d="M156 128a28 28 0 1 1-28-28a28.1 28.1 0 0 1 28 28ZM48 100a28 28 0 1 0 28 28a28.1 28.1 0 0 0-28-28Zm160 0a28 28 0 1 0 28 28a28.1 28.1 0 0 0-28-28Z"
              /></svg
            >
          </div>
          {#if options.show && options.item.id === item.id}
            <ContextMenu
              items={[
                {
                  label: !item.completed ? "Complete" : "Uncomplete",
                  icon: `<svg width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M104 190a5.8 5.8 0 0 1-4.2-1.8l-56-56a5.9 5.9 0 0 1 8.4-8.4l51.8 51.7L211.8 67.8a5.9 5.9 0 0 1 8.4 8.4l-112 112a5.8 5.8 0 0 1-4.2 1.8Z"/></svg>`,
                  type: "shortcut",
                  shortcut: "Control+Enter",
                  id: "complete",
                },
                {
                  label: "Add note",
                  icon: `<svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M17.263 2.177a1.75 1.75 0 0 1 2.474 0l2.586 2.586a1.75 1.75 0 0 1 0 2.474L19.53 10.03l-.012.013L8.69 20.378a1.75 1.75 0 0 1-.699.409l-5.523 1.68a.75.75 0 0 1-.935-.935l1.673-5.5a1.75 1.75 0 0 1 .466-.756L14.476 4.963l2.787-2.786zm-2.275 4.371l-10.28 9.813a.25.25 0 0 0-.067.108l-1.264 4.154l4.177-1.271a.25.25 0 0 0 .1-.059l10.273-9.806l-2.94-2.939zM19 8.44l2.263-2.262a.25.25 0 0 0 0-.354l-2.586-2.586a.25.25 0 0 0-.354 0L16.061 5.5L19 8.44z"/></svg>`,
                  type: "shortcut",
                  shortcut: "Shift+Enter",
                  id: "desc",
                },
                {
                  label: "Delete",
                  type: "shortcut",
                  icon: `<svg width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M216 50h-42V40a22.1 22.1 0 0 0-22-22h-48a22.1 22.1 0 0 0-22 22v10H40a6 6 0 0 0 0 12h10v146a14 14 0 0 0 14 14h128a14 14 0 0 0 14-14V62h10a6 6 0 0 0 0-12ZM94 40a10 10 0 0 1 10-10h48a10 10 0 0 1 10 10v10H94Zm100 168a2 2 0 0 1-2 2H64a2 2 0 0 1-2-2V62h132Zm-84-104v64a6 6 0 0 1-12 0v-64a6 6 0 0 1 12 0Zm48 0v64a6 6 0 0 1-12 0v-64a6 6 0 0 1 12 0Z"/></svg>`,
                  shortcut: "Control+Shift+Del",
                  id: "del",
                },
              ]}
              on:blur={() => (options.show = false)}
              on:click={contextClicked}
              position={options.position}
            />
          {/if}
        </div>
        <div class="bullets">
          <Bullet
            background={!!item.children?.length && !item.open}
            on:click={() => dispatch("zoom", { item })}
          />
          {#if item.display === "checkbox"}<Checkbox
              on:click={() => dispatch("togglecomplete", { id: item.id })}
            />{/if}
        </div>
        <E
          on:change={() => dispatch("change", item)}
          bind:value={item.text}
          on:delete={() => dispatch("delete", { id: item.id })}
          on:newbullet={() => dispatch("newbullet", { id: item.id })}
          on:ready={() => dispatch("ready", { id: item.id })}
          on:outdent={() => dispatch("outdent", { id: item.id })}
          on:indent={() => dispatch("indent", { id: item.id })}
          on:selectup={() => dispatch("selectup", { id: item.id })}
          on:selectdown={() => dispatch("selectdown", { id: item.id })}
          on:togglecomplete={() => dispatch("togglecomplete", { id: item.id })}
          on:description={() => {
            container
              .querySelector(`#item_${item.id} .description[contenteditable]`)
              .dispatchEvent(new CustomEvent("api-focus"));
          }}
        />
      </div>
      <span class="description" class:empty={!item.description?.trim()?.length}>
        <E
          description={true}
          c="description"
          bind:value={item.description}
          on:change={() => dispatch("change", item)}
          on:delete={() => {
            container
              .querySelector(`#item_${item.id} .editable`)
              .dispatchEvent(new CustomEvent("api-focus"));
          }}
          on:togglecomplete={() => dispatch("togglecomplete", { id: item.id })}
          on:description={() => {
            container
              .querySelector(`#item_${item.id} .editable`)
              .dispatchEvent(new CustomEvent("api-focus"));
          }}
        />
      </span>
    </li>
  {/if}
  {#if item.children && (item.open || open)}
    <ul class:children={!isTop}>
      {#each item.children as child, idx}
        <svelte:self
          on:zoom={(e) => dispatch("zoom", { item: e.detail.item })}
          on:indent={(e) => {
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            let target = item.children.find((i) => i.id === e.detail.id);
            let placement;
            if (idx > 0) {
              item.children[idx - 1].children = [
                ...(item.children[idx - 1].children || []),
                target,
              ];
              const focus = () => {
                container
                  .querySelector(`#item_${target.id} .editable`)
                  .dispatchEvent(new CustomEvent("api-focus"));
              };
              for (let i of [item, item.children[idx - 1]]){
                i.open = true;
              }
              item.children = item.children.filter((i) => i.id !== target.id);
              console.log(item)
              setTimeout(focus);
            }
          }}
          on:togglecomplete={(e) => {
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            item.children[idx].completed = !item.children[idx].completed;
          }}
          on:delete={(e) => {
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            if (idx > 0) {
              container
                .querySelector(`#item_${item.children[idx - 1].id} .editable`)
                .dispatchEvent(new CustomEvent("api-focus"));
            } else {
              container
                .querySelector(`#item_${item.id} .editable`)
                .dispatchEvent(new CustomEvent("api-focus"));
            }
            item.children = item.children.filter((i) => i.id !== e.detail.id);
          }}
          on:outdent={(e) => {
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            // If there are elements after
            let current = item.children[idx];
            if (idx < item.children.length - 1) {
              let removed = item.children.slice(idx, item.children.length);
              removed = removed.filter((i) => i.id !== current.id);
              console.log(removed);
              item.children = item.children.slice(0, idx + 1);
              if (!current.children) {
                current.children = [];
              }
              current.children.push(...removed);
            }
            item.children = item.children.filter((i) => i.id !== current.id);
            setTimeout(() => {
              item.children = item.children.filter((i) => i.id !== current.id);
            });
            console.log(current, item);
            dispatch("parentoutdent", { item: current, parent: item });
            dispatch("change", item);
          }}
          on:parentoutdent={(e) => {
            let idx = item.children.findIndex(
              (i) => i.id === e.detail.parent.id
            );
            item.children.splice(idx + 1, 0, e.detail.item);
            setTimeout(() => {
              container
                .querySelector(`#item_${e.detail.item.id} .editable`)
                .dispatchEvent(new CustomEvent("api-focus"));
            });
          }}
          on:selectup={(e) => {
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            if (idx > 0) {
              if (item.children[idx - 1]?.children?.length) {
                container
                  .querySelector(
                    `#item_${
                      item.children[idx - 1].children.slice(-1)[0].id
                    } .editable`
                  )
                  .dispatchEvent(new CustomEvent("api-focus"));
              } else {
                container
                  .querySelector(`#item_${item.children[idx - 1].id} .editable`)
                  .dispatchEvent(new CustomEvent("api-focus"));
              }
            } else if (idx === 0) {
              container
                .querySelector(`#item_${item.id} .editable`)
                .dispatchEvent(new CustomEvent("api-focus"));
            }
          }}
          on:selectdown={(e) => {
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            if (item.children[idx].children?.length && !e.detail.skip) {
              container
                .querySelector(
                  `#item_${item.children[idx].children[0].id} .editable`
                )
                .dispatchEvent(new CustomEvent("api-focus"));
              return;
            }
            if (idx < item.children?.length - 1) {
              container
                .querySelector(`#item_${item.children[idx + 1].id} .editable`)
                .dispatchEvent(new CustomEvent("api-focus"));
            } else if (idx === item.children?.length - 1) {
              dispatch("selectdown", { id: item.id, skip: true });
            }
          }}
          on:newbullet={(e) => {
            const newItem = id();
            let idx = item.children.findIndex((i) => i.id === e.detail.id);
            item.children.splice(idx + 1, 0, {
              text: "",
              id: newItem,
              children: [],
              completed: false,
            });
            item.children = [...item.children];
            setTimeout(() => {
              container
                .querySelector(`#item_${newItem} .editable`)
                .dispatchEvent(new CustomEvent("api-focus"));
            });
          }}
          item={child}
          on:change={(e) => (
            (item.children[idx] = e.detail), dispatch("change", item)
          )}
        />
      {/each}
    </ul>
  {/if}
</div>

<style>
  .completed :global(.editable:not(.description .editable)) {
    text-decoration: line-through;
  }
  .parentcompleted h2 {
    text-decoration: line-through;
  }
  .description {
    display: block;
    font-size: 0.8rem;
    text-decoration: none;
    opacity: 0.5;
    margin-left: 2.3rem;
  }
  .hover {
    border-radius: 1000px;
    padding: 3px;
    background: transparent;
    display: grid;
    place-items: center;
    position: absolute;
    left: -1.2rem;
    opacity: 0;
    top: 0;
  }
  /* This compensates for the space taken by the buttons on the other ones */
  .nochildren {
    margin-left: 1rem;
  }
  .hover svg {
    width: 1rem;
    height: 1rem;
  }
  .item:hover:not(:has(.item)) .hover,
  .options_open .hover {
    opacity: 0.3;
  }
  .hover:hover,
  .options_open .hover {
    background: #0007;
  }
  ul {
    padding: 0;
  }
  .children {
    /* Padding is inside the border */
    padding-left: 1.3rem;
    border-left: 2px solid #ddd;
    margin-left: 1.5rem;
  }
  li {
    padding: 0.2rem 0;
    list-style: none;
    display: flex;
    position: relative;
    flex-direction: column;
  }
  .top {
    display: flex;
    align-items: center;
  }
  .top {
    width: 100%;
  }
  .bullets {
    display: flex;
  }
  .parentcompleted:not(.parentcompleted .parentcompleted) :global(.editable) {
    opacity: 0.7;
  }
  * {
    font-family: "Helvetica Neue", Arial, sans-serif;
  }
</style>
