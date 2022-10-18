<script>
  import { id } from "./utilities.js";
  import List from "./List.svelte";
  import BreadCrumb from "./BreadCrumb.svelte";
  let path;
  let bullet = {
    text: "Hello <i>world</i>",
    description: "Description",
    id: "tukpjtucg",
    completed: false,
    children: [
      {
        text: "What is this?",
        id: "xlhueplvhc",
        children: [
          {
            text: "It's a clone of a popular app called Workflowy",
            id: "orufxxowvt",
            children: [
              {
                text: "What is Workflowy?",
                id: "pyvl",
                children: [
                  {
                    text: "Basically what you're seeing here",
                    id: "jginukt",
                    children: [],
                    completed: false,
                    description: "",
                    open: true,
                  },
                  {
                    text: "Coming soon:",
                    id: "vlhekkhyh",
                    children: [
                      {
                        text: "mirror items",
                        id: "rpkqtwnja",
                        children: [],
                        completed: false,
                        description: "",
                        open: true,
                      },
                      {
                        text: "Add links, formatting toolbar",
                        id: "ljgfuczcn",
                        children: [],
                        completed: false,
                        description: "",
                        open: true,
                      },
                      {
                        text: "Corner click menus",
                        id: "magpdsz",
                        children: [],
                        completed: false,
                        description: "",
                        open: true,
                      },
                      {
                        text: "Parse exported items from workflowy",
                        id: "xntpyxib",
                        children: [],
                        completed: false,
                        description: "",
                        open: true,
                      },
                    ],
                    completed: false,
                    description: "",
                    open: true,
                  },
                  {
                    text: "Why?",
                    id: "adewrnpl",
                    children: [
                      {
                        text: "I was bored",
                        id: "wycremrdh",
                        children: [],
                        completed: false,
                        description: "",
                        open: true,
                      },
                    ],
                    completed: false,
                    description: "",
                    open: true,
                  },
                ],
                completed: false,
                description: "",
                open: false,
              },
            ],
            completed: false,
            description: "Workflowy isn't open source. Which annoys me",
            open: true,
          },
          {
            text: "Who made it?",
            id: "vsjjyvn",
            children: [
              {
                text: "@Explosion-Scratch",
                id: "mbrfqyvk",
                children: [],
                completed: false,
                description: "",
                open: true,
              },
            ],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "Click the home button in the header to see more!",
            id: "home",
          },
        ],
        completed: false,
        description: "",
        open: true,
      },
      {
        text: "How do I use it?",
        id: "ivvhql",
        children: [
          {
            text: "Just type basically",
            id: "vqrioja",
            children: [],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "Hit enter to create a new bullet point",
            id: "dwkdpdobsj",
            children: [
              {
                text: "Hover over the bullet icon of a bullet point to collapse it",
                id: "igaitpi",
                children: [],
                completed: false,
                description: "",
                open: true,
              },
            ],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "Press tab to indent an item",
            id: "azozdsc",
            children: [
              {
                text: "Press Shift + Tab to undo it",
                id: "vruwdrvhhf",
                children: [],
                completed: false,
                description: "",
                open: true,
              },
            ],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "Click on the menu up top to navigate back to the main notes!",
            id: "quaw",
            children: [],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "Use shift + enter to add a description",
            id: "gkdjyurwse",
            children: [
              {
                text: "Press shift + enter again to go back to editing bullet points",
                id: "enwefxnd",
                children: [],
                completed: false,
                description: "",
                open: true,
              },
            ],
            completed: false,
            description: "Like this",
            open: true,
          },
        ],
        completed: false,
        description: "",
        open: false,
      },
      {
        text: "Show me some features!",
        id: "dalmdwc",
        children: [
          {
            text: "It's rich HTML so you can use <b>bold</b>&nbsp;and <i>italic</i>&nbsp;text",
            id: "atlmloojt",
            children: [],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "You can collapse items by clicking on the arrow new to the bullet point",
            id: "dipzengk",
            children: [],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: 'You can "zoom" to items by clicking on the bullet point',
            id: "tvdsgndh",
            children: [],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "You can add descriptions with Shift + enter",
            id: "lfobtj",
            children: [],
            completed: false,
            description: "",
            open: true,
          },
          {
            text: "You eventually will be able to toggle the style of the bullet points",
            id: "tialrbnq",
            children: [
              {
                text: "Like this checkbox!",
                id: "maypdcfsvd",
                children: [],
                display: "checkbox",
                completed: false,
                description: "",
                open: true,
              },
            ],
            completed: false,
            description: "",
            open: true,
          },
        ],
        completed: false,
        description: "",
        open: true,
      },
    ],
    open: true,
  };
  let route = [];
  let current = bullet.children[0];
  function changed() {
    if (current.id == bullet.id) {
      bullet = current;
      path = "";
    } else {
      path = pathTo(current, bullet);
      console.log(path);
      bullet = set(bullet, path, current);
    }
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
      on:change={changed}
      bind:item={current}
      isTop={true}
      on:zoom={(e) => (current = e.detail.item)}
    />
  </div>
</div>

<style>
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
