////////////////////////////////////////////////
////// UI code specific to addition game
///////////////////////////////////////////////
let operator = "+";
let gameType = "FLASH_CARDS_ADDITION";

function getCorrectAnswer(questionPrompt) {
  return questionPrompt[0] + questionPrompt[1];
}

function resetAllAnimatedBlocks() {
  for (let i = 0; i < 10; i++) {
    document.querySelector(`#animated-blocks-table tr:nth-child(1) td:nth-child(${i + 1})`).classList.remove("filled-in");
  }

  for (let j = 0; j < 10; j++) {
    document.querySelector(`#animated-blocks-table tr:nth-child(2) td:nth-child(${j + 1})`).classList.remove("filled-in");
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

  for (let j = 0; j < prompt[1]; j++) {
    counter++;
    setTimeout(() => {
      document.querySelector(`#animated-blocks-table tr:nth-child(2) td:nth-child(${j + 1})`).classList.add("filled-in");
    }, 21 * counter);
  }
}