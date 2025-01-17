<script>
  import { len, splitMax, trimPrefix } from "../util";
  import { focus } from "../actions";
  import ListBox from "./ListBox.svelte";
  import { extractShortcut } from "../keys";

  /** @typedef {[string, number]} CmdDef */

  /** @type {{
    executeCommand: (id: number) => void,
    switchToNoteSelector: () => void,
    commandsDef: CmdDef[],
}}*/
  let { executeCommand, switchToNoteSelector, commandsDef } = $props();

  /** @typedef {{
   key: number,
   name: string,
   nameLC: string,
   shortcut: string,
   ref: HTMLElement,
  }} Item 
   */

  /**
   * @returns {Item[]}
   */
  function buildCommands() {
    // console.log("rebuildCommands:", commands);
    /** @type {Item[]} */
    let res = Array(len(commandsDef));
    for (let i = 0; i < len(commandsDef); i++) {
      let s = commandsDef[i][0];
      let id = commandsDef[i][1];
      let parts = splitMax(s, "\t", 2);
      let name = parts[0];
      let shortcut = null;
      if (len(parts) > 1) {
        shortcut = extractShortcut(parts[1]);
      }
      // console.log("name:", name, "id:", id);
      let item = {
        key: id,
        name: name,
        nameLC: name.toLowerCase(),
        shortcut: shortcut,
        ref: null,
      };
      res[i] = item;
    }
    // -1 if a < b
    // 0 if a = b
    // 1 if a > b
    res.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    return res;
  }
  let itemsInitial = $state(buildCommands());
  let cmdCountMsg = `${len(itemsInitial)} commands`;
  let filter = $state(">");

  let itemsFiltered = $derived.by(() => {
    // we split the search term by space, the name of the note
    // must match all parts
    let lc = filter.toLowerCase();
    if (lc === "") {
      switchToNoteSelector();
      return;
    }
    lc = trimPrefix(lc, ">");
    lc = lc.trim();
    let parts = lc.split(" ");
    let n = len(parts);
    for (let i = 0; i < n; i++) {
      let s = parts[i];
      parts[i] = s.trim();
    }
    return itemsInitial.filter((noteInfo) => {
      let s = noteInfo.nameLC;
      for (let p of parts) {
        if (s.indexOf(p) === -1) {
          return false;
        }
      }
      return true;
    });
  });

  /** @type {Item} */
  let selectedItem = $state(null);

  $effect(() => {
    console.log("selectedCommand:", selectedItem ? selectedItem.name : "null");
  });

  /**
   * @param {KeyboardEvent} ev
   */
  function onKeydown(ev) {
    // console.log("onKeyDown:", event);
    let key = ev.key;

    if (key === "Enter") {
      ev.preventDefault();
      if (selectedItem) {
        console.log("onKeyDown: selectedCommand:", selectedItem.name);
        executeCommand(selectedItem.key);
      }
    }
    if (key === "ArrowUp" || (key === "ArrowLeft" && filter === "")) {
      ev.preventDefault();
      listbox.up();
      return;
    }

    if (key === "ArrowDown" || (key === "ArrowRight" && filter === "")) {
      ev.preventDefault();
      listbox.down();
      return;
    }
  }

  /**
   * @param {Item} item
   */
  function emitExecuteCommand(item) {
    // console.log("emitOpenNote", item);
    executeCommand(item.key);
  }

  let listbox;
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
  onkeydown={onKeydown}
  tabindex="-1"
  class="selector z-20 absolute center-x-with-translate top-[2rem] flex flex-col max-h-[90vh] w-[32em] p-2"
>
  <div>
    <input
      type="text"
      use:focus
      bind:value={filter}
      class="py-1 px-2 bg-white w-full mb-2 rounded-sm relative"
    />
    <div class="absolute right-[1rem] top-[0.75rem] italic text-gray-400">
      {cmdCountMsg}
    </div>
  </div>
  <ListBox
    bind:this={listbox}
    bind:selectedItem
    items={itemsFiltered}
    onclick={(item) => emitExecuteCommand(item)}
  >
    {#snippet renderItem(item)}
      <div class="truncate">
        {item.name}
      </div>
      <div class="grow"></div>
      <div class="mr-2">{item.shortcut}</div>
    {/snippet}
  </ListBox>
</form>
