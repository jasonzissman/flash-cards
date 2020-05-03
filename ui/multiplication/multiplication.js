////////////////////////////////////////////////
////// UI code specific to multiplication game
///////////////////////////////////////////////

let gameType = "FLASH_CARDS_MULTIPLICATION";

function resetAllAnimatedBlocks() {
  for (let i = 11; i > -1; i--) {
    for (let j = 0; j < 12; j++) {
      document.querySelector(`#animated-blocks-table tr:nth-child(${i + 1}) td:nth-child(${j + 1})`).classList.remove("filled-in");
    }
  }
}

function performBlocksAnimation(prompt) {
  let counter = 0;
    for (let j = 11; j > (11 - prompt[1]); j--) {
      for (let i = 0; i < prompt[0]; i++) {
        counter++;
        setTimeout(() => {
          document.querySelector(`#animated-blocks-table tr:nth-child(${j + 1}) td:nth-child(${i + 1})`).classList.add("filled-in");
        }, 21 * counter);
      }
    }
}