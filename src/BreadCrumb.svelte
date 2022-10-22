<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let path;
  export let bullet = {};
  let route = [];
  $: {
    if (!path) {
      route = [];
      break $;
    }
    let r = path.split(".");
    let out = [];
    let curr = bullet;
    for (let key of r) {
      out.push(curr[key]);
      curr = curr[key];
    }
    route = out;
  }
</script>

<div class="crumb_container">
  <svg
    class="home"
    on:click={() => dispatch("click", { path: "" })}
    width="32"
    height="32"
    viewBox="0 0 256 256"
    ><path
      fill="currentColor"
      d="M208 222H48a14 14 0 0 1-14-14v-92.5a13.9 13.9 0 0 1 4.6-10.3l80-72.8a14.1 14.1 0 0 1 18.8 0l80 72.8a13.9 13.9 0 0 1 4.6 10.3V208a14 14 0 0 1-14 14ZM128 40.8a1.9 1.9 0 0 0-1.3.5l-80 72.8a1.6 1.6 0 0 0-.7 1.4V208a2 2 0 0 0 2 2h160a2 2 0 0 0 2-2v-92.5a1.8 1.8 0 0 0-.6-1.4l-80.1-72.8a1.9 1.9 0 0 0-1.3-.5Z"
    /></svg
  >
  {#if route.filter((i) => !Array.isArray(i)).length > 0}
    <svg class="right nomargin" width="32" height="32" viewBox="0 0 256 256"
      ><path
        fill="currentColor"
        d="M96 214a6 6 0 0 1-4.2-10.2l75.7-75.8l-75.7-75.8a5.9 5.9 0 0 1 8.4-8.4l80 80a5.8 5.8 0 0 1 0 8.4l-80 80A5.8 5.8 0 0 1 96 214Z"
      /></svg
    >
  {/if}
  {#each route as r, idx}
    {#if !Array.isArray(r)}
      {@const filtered = route.filter(i => !Array.isArray(i))}
      <button
        class:last={filtered.indexOf(r) === filtered.length - 1}
        class="crumb"
        on:click={() =>
          dispatch("click", { path: path.split(".").slice(0, idx + 1) })}
      >
        {r.text}
      </button>
      {#if r !== route.filter((i) => !Array.isArray(i)).slice(-1)[0]}<svg
          class="right"
          width="32"
          height="32"
          viewBox="0 0 256 256"
          ><path
            fill="currentColor"
            d="M96 214a6 6 0 0 1-4.2-10.2l75.7-75.8l-75.7-75.8a5.9 5.9 0 0 1 8.4-8.4l80 80a5.8 5.8 0 0 1 0 8.4l-80 80A5.8 5.8 0 0 1 96 214Z"
          /></svg
        >{/if}
    {/if}
  {/each}
</div>

<style>
  .crumb {
    all: unset;
  }

  .crumb_container {
    display: flex;
    color: #999;
    font-size: .8em;
    align-items: center;
  }
  .last {
    color: #333;
  }
  .crumb:hover {
    all: unset;
    cursor: pointer;
  }
  .home {
    transition: background 0.1s ease;
    border-radius: 10000px;
    padding: 7px;
    margin: 0 !important;
    margin-right: -7px !important;
    cursor: pointer;
  }
  .home:hover {
    background: #0001;
  }
  svg {
    width: 1.2rem;
    margin: 6px;
    height: 1.2rem;
  }
  .nomargin {
    margin: none !important;
  }
  .right {
    width: .9em;
    height: .9em;
  }
</style>
