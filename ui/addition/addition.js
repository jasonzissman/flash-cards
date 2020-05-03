////////////////////////////////////////////////
////// UI code specific to addition game
///////////////////////////////////////////////

let gameType= "FLASH_CARDS_ADDITION";

function resetAllAnimatedBlocks() {
  for (let i = 1; i > -1; i--) {
    for (let j = 0; j < 2; j++) {
      document.querySelector(`#animated-blocks-table tr:nth-child(${i + 1}) td:nth-child(${j + 1})`).classList.remove("filled-in");
    }
  }
}

function performBlocksAnimation(prompt) {
  let counter = 0;

  for (let i = 0; i < prompt[0]; i++) {
    counter++;
    setTimeout(() => {
      document.querySelector(`#animated-blocks-table tr:nth-child(1) td:nth-child(${i + 1})`).classList.add("filled-in");
    }, 21 * counter);
  }

  for (let j = 0; j < prompt[1]; i++) {
    counter++;
    setTimeout(() => {
      document.querySelector(`#animated-blocks-table tr:nth-child(2) td:nth-child(${i + 1})`).classList.add("filled-in");
    }, 21 * counter);
  }
}