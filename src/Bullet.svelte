<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let background = true;
</script>

<button class:background class="zoom" on:click={() => dispatch("click")}>
  <svg viewBox="0 0 18 18" fill="currentColor" class="bullet"
    ><circle fill="black" cx="9" cy="9" r="3.5" /></svg
  >
</button>

<style>
  .zoom {
    all: unset;
    display: inline-grid !important;
    place-items: center !important;
  }
  .zoom:active,
  .zoom:hover,
  .zoom:focus {
    all: unset;
  }
  .bullet {
    display: inline-grid;
    place-items: center;
    width: 1em;
    height: 1em;
    margin-right: 0.3rem;
  }
  svg {
    border-radius: 50%;
    width: 1em;
    height: 1em;
    cursor: pointer;
  }
  .background svg {
    background: #eee;
  }
  svg:hover {
    background: #ccc;
  }
</style>
