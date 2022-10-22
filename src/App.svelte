<script>
  import { id } from "./utilities.js";
  import List from "./List.svelte";
  import BreadCrumb from "./BreadCrumb.svelte";
  import {onMount} from "svelte";
  import sampleData from "./sample.js";
  let path;
  let bullet = sampleData;
  let route = [];
  let current = bullet;

  onMount(() => {
    if (localStorage.getItem('listItems')){
      try {
        let json = JSON.parse(localStorage.listItems);
        if (json?.id && json?.children?.length){
          bullet = json;
        }
      } catch(e){ 
        bullet = sampleData;
      }
    }
    current = bullet;
  })

  function changed() {
    if (current.id == bullet.id) {
      bullet = current;
      path = "";
    } else {
      path = pathTo(current, bullet);
      console.log(path);
      bullet = set(bullet, path, current);
    }
    localStorage.setItem('listItems', JSON.stringify(bullet))
  }
  function set(e, n, o) {
    const t = n.split("."),
      c = t.pop();
    return (
      (t.reduce((e, n) => (void 0 === e[n] && (e[n] = {}), e[n]), e)[c] = o), e
    );
  }
  function pathTo(r, t) {
    for (var f in t)
      if (t.hasOwnProperty(f)) {
        if (r === t[f]) return f;
        if (t[f] && "object" == typeof t[f]) {
          var o = pathTo(r, t[f]);
          if (o) return f + "." + o;
        }
      }
  }
  const deepGet = (e, l) =>
    l.reduce(
      (e, l) => (e && null !== e[l] && void 0 !== e[l] ? e[l] : null),
      e
    );
</script>

<div class="header">
  <BreadCrumb
    {path}
    {bullet}
    on:click={(e) => {
      current = e.detail.path === "" ? bullet : deepGet(bullet, e.detail.path);
    }}
  />
  <svg
    class="copy"
    on:click={() =>
      navigator.clipboard.writeText(JSON.stringify(bullet, null, 2))}
    width="32"
    height="32"
    viewBox="0 0 256 256"
    ><path
      fill="currentColor"
      d="M216 34H88a6 6 0 0 0-6 6v42H40a6 6 0 0 0-6 6v128a6 6 0 0 0 6 6h128a6 6 0 0 0 6-6v-42h42a6 6 0 0 0 6-6V40a6 6 0 0 0-6-6Zm-54 176H46V94h116Zm48-48h-36V88a6 6 0 0 0-6-6H94V46h116Z"
    /></svg
  >
</div>
<div class="outer_container">
  <div class="container">
    <List
    outermost={true}
      on:change={changed}
      bind:item={current}
      isTop={true}
      on:zoom={(e) => (current = e.detail.item)}
    />
  </div>
</div>

<style>
  :root {
    --accent: #49baf2;
  }
  .outer_container {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    overflow-y: scroll;
    display: grid;
    place-items: center;
    padding-top: 60px;
  }
  .header {
    position: fixed;
    top: 0;
    padding: 0.5rem;
    background: white;
    width: 100vw;
    border-bottom: 1px solid #eee;
    z-index: 1;
  }
  .container {
    min-height: 80vh;
    height: fit-content;
    width: 80vw;
    max-width: 600px;
  }
  :global(body) {
    padding: 0 !important;
  }
  .copy {
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    color: #ccc;
    cursor: pointer;
  }
  :global(::-webkit-scrollbar-thumb) {
    background-color: rgb(236, 238, 240);
    border-radius: 4px;
  }
  :global(::-webkit-scrollbar) {
    width: 8px;
  }
</style>
