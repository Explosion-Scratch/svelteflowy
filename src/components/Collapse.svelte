<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let collapsed = false
</script>

<button
  class="collapse"
  class:collapsed
  on:click={() => dispatch('change')}
>
  <svg width="20" height="20" viewBox="0 0 20 20">
    <path
      d="M13.75 9.56879C14.0833 9.76124 14.0833 10.2424 13.75 10.4348L8.5 13.4659C8.16667 13.6584 7.75 13.4178 7.75 13.0329L7.75 6.97072C7.75 6.58582 8.16667 6.34525 8.5 6.5377L13.75 9.56879Z"
      stroke="none"
      fill="currentColor"
    />
  </svg>
</button>

<style>
  .collapse {
    all: unset;
    display: inline-grid;
    place-items: center;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  svg {
    width: 100%;
    height: 100%;
    color: rgb(220, 224, 226);
    transition: transform 0.2s ease;
    transform: rotate(90deg);
  }

  svg:hover {
    color: #333;
  }

  .collapsed svg {
    transform: rotate(0deg);
  }
</style>
