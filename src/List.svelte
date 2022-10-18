<script>
    import { id } from "./utilities.js";
      import Collapse from "./Collapse.svelte";
      import Checkbox from "./Checkbox.svelte";
      import Bullet from "./Bullet.svelte";
    import { createEventDispatcher } from "svelte";
    import E from "./Editable.svelte";
    export let item = {};
    export let isTop = false;
    export let container;
    const dispatch = createEventDispatcher();
      import {onMount, afterUpdate} from "svelte";
      let open = false;
      afterUpdate(() => {
          if (item.open === undefined){
              item.open = true;
          }
          if (isTop && !item.open){
              //Open is the non-saved version of item.open
              open = true;
          }
          if (!item.children){
              item.children = [];
          }
          if (!item.description){
              item.description = "";
          }
          dispatch("change", item)
      })
  </script>

  <div class="item" bind:this={container} class:parentcompleted={item.completed}>
    {#if isTop}
      <h2 class="item_title" id="item_{item.id}">
        <E
          bind:value={item.text}
                  on:selectdown={(e) => {
                      if (item.children?.length){
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
    {:else}
      <li class="item" id="item_{item.id}" class:completed={item.completed}>
              <div class="top">
                  <div class="bullets">
                      {#if item.children?.length}<Collapse bind:collapsed={item.open} on:change={() => dispatch("change", item)}></Collapse>{:else}
                          <span class="spacer"></span>
                      {/if}
                      <Bullet background={!!item.children?.length && !item.open} on:click={() => dispatch("zoom", {item})}></Bullet>
                      {#if item.display === 'checkbox'}<Checkbox on:click={() => dispatch("togglecomplete", {id: item.id})}></Checkbox>{/if}
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
                      on:togglecomplete={() => dispatch("togglecomplete", {id: item.id})}
                      on:description={() => {
                          container
                              .querySelector(`#item_${item.id} .editable`)
                              .dispatchEvent(new CustomEvent("api-focus"));
                      }}></E>
              </span>
      </li>
    {/if}
    {#if item.children && (item.open || open)}
      <ul class:children={!isTop}>
        {#each item.children as child, idx}
          <svelte:self
                      on:zoom={(e) => dispatch("zoom", {item: e.detail.item})}
                      on:indent={(e) => {
                          let idx = item.children.findIndex((i) => i.id === e.detail.id);
                           let target = item.children.find((i) => i.id === e.detail.id)
                        let placement;
              if (idx > 0) {
                item.children[idx - 1].children = [
                                  ...item.children[idx - 1].children || [],
                                  target,
                              ]
                          item.children = item.children.filter(i => i.id !== target.id)
                              setTimeout(() => {
                                  container
                                      .querySelector(`#item_${target.id} .editable`)
                                      .dispatchEvent(new CustomEvent("api-focus"));
                              })
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
                          let idx = item.children.findIndex(i => i.id === e.detail.id);
                        // If there are elements after
                          let current = item.children[idx];
                        if (idx < item.children.length - 1){
                              let removed = item.children.slice(idx, item.children.length);
                              removed = removed.filter(i => i.id !== current.id);
                              console.log(removed);
                              item.children = item.children.slice(0, idx + 1);
                              if (!current.children){current.children = []}
                              current.children.push(...removed);
                          }
                          item.children = item.children.filter(i => i.id !== current.id);
                          setTimeout(() => {
                              item.children = item.children.filter(i => i.id !== current.id);
                          })
                          console.log(current, item)
                          dispatch("parentoutdent", {item: current, parent: item});
                          dispatch("change", item)
                      }}
                      on:parentoutdent={(e) => {
                          let idx = item.children.findIndex(i => i.id === e.detail.parent.id);
                          item.children.splice(idx + 1, 0, e.detail.item);
                          setTimeout(() => {
                      container
                  .querySelector(`#item_${e.detail.item.id} .editable`)
                  .dispatchEvent(new CustomEvent("api-focus"));
                      })
                      }}
                      on:selectup={(e) => {
                          let idx = item.children.findIndex(i => i.id === e.detail.id);
                          if (idx > 0){
                              if (item.children[idx - 1]?.children?.length){
                                  container
                                      .querySelector(`#item_${item.children[idx - 1].children.slice(-1)[0].id} .editable`)
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
                          let idx = item.children.findIndex(i => i.id === e.detail.id);
                        if (item.children[idx].children?.length && !e.detail.skip){
                              container
                  .querySelector(`#item_${item.children[idx].children[0].id} .editable`)
                  .dispatchEvent(new CustomEvent("api-focus"));
                              return;
                          }
                          if (idx < item.children?.length - 1){
                              container
                  .querySelector(`#item_${item.children[idx + 1].id} .editable`)
                  .dispatchEvent(new CustomEvent("api-focus"));
                          } else if (idx === item.children?.length - 1){
                              dispatch("selectdown", {id: item.id, skip: true})
                          }
                      }}
            on:newbullet={(e) => {
              const newItem = id();
                        let idx = item.children.findIndex(i => i.id === e.detail.id);
              item.children.splice(idx + 1, 0, { text: "", id: newItem, children: [], completed: false })
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
      .completed :global(.editable:not(.description .editable)) {text-decoration: line-through;}
      .parentcompleted h2 {
          text-decoration: line-through;
      }
      .description {
          display: block;
          font-size: .8rem;
          text-decoration: none;
          opacity: .5;
          margin-left: 2.3rem;
      }
      ul {
          padding: 0;
      }
      .children {
          padding-left: 1rem;
          border-left: 2px solid #ddd;
          margin-left: 1.5rem;
      }
      li {
          list-style: none;
          display: flex;
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
          opacity: .7;
      }
      .spacer {
          width: 1rem;
          height: 1rem;
          display: inline-block;
      }
      * {
          font-family: "Helvetica Neue", Arial, sans-serif;
      }
  </style>