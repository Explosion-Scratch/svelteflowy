<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<button class="checkbox" on:click={(e) => dispatch("click", e)}>
  <svg class="completed_check" width="32" height="32" viewBox="0 0 24 24"
    ><path
      fill="currentColor"
      d="m10.6 16.2l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4ZM5 21q-.825 0-1.413-.587Q3 19.825 3 19V5q0-.825.587-1.413Q4.175 3 5 3h14q.825 0 1.413.587Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5H5v14ZM5 5v14V5Z"
    /></svg
  >
  <svg class="incomplete_check" width="32" height="32" viewBox="0 0 24 24"
    ><path
      fill="currentColor"
      d="M5 21q-.825 0-1.413-.587Q3 19.825 3 19V5q0-.825.587-1.413Q4.175 3 5 3h14q.825 0 1.413.587Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5H5v14Z"
    /></svg
  >
</button>

<style>
  .checkbox {
    all: unset;
    display: inline-block;
    cursor: pointer;
    margin-right: 6px;
  }
  .completed_check {
    display: none;
  }
  svg {
    width: 1rem;
    height: 1rem;
    transform: translateY(0.1rem);
  }
  .incomplete_check {
    display: inline-block;
  }
  .checkbox:is(.completed .checkbox) .completed_check {
    display: inline-block;
  }
  .checkbox:is(.completed .checkbox) .incomplete_check {
    display: none;
  }
  .checkbox {
    display: inline-block;
  }
</style>
