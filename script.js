// 导入poems
let poems = {}; // 将存储加载的数据

fetch('poems.json')
  .then(response => {
    if (!response.ok) throw new Error('网络响应错误');
    return response.json();
  })
  .then(data => {
    poems = data; // 直接将JSON对象赋给变量
    console.log(poems.bxs['短歌行']); // 访问数据示例
  })
  .catch(error => {
    console.error('加载失败:', error);
  });

let memorizationText = "";
let sentences = [];
let currentSentenceIndex = 1;
let currentWordIndex = 0;
let currentSentenceWords = [];
let displayedWords = [];
let currentCategory = ""; // 跟踪当前选中的分类
let errorCount = 0;
let currentPoemTitle = "";
const memorizedSentencesDiv = document.getElementById("memorized-sentences");
const currentSentenceDiv = document.getElementById("current-sentence");
const poemSelectContainer = document.getElementById("poem-select-container");

function showPoems(category) {
    // 移除所有按钮的active类
    document.querySelectorAll('#poem-categories button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 为当前选中的按钮添加active类
    document.querySelector(`button[onclick="showPoems('${category}')"]`).classList.add('active');
    
    // 保存当前选中的分类
    currentCategory = category;
    
    const poemSelect = document.getElementById("poem-select");
    poemSelect.innerHTML = '<option value="" disabled selected>请选择</option>';
    const selectedCategoryPoems = poems[category];
    if (selectedCategoryPoems) {
        for (const title in selectedCategoryPoems) {
            const option = document.createElement("option");
            option.value = category + "-" + title; // Store category with title
            option.textContent = title;
            poemSelect.appendChild(option);
        }
        poemSelectContainer.style.display = "block"; // Show the poem select dropdown
    } else {
        poemSelectContainer.style.display = "none";
    }
}

function loadPoem() {
    const selectedValue = document.getElementById("poem-select").value;
    if (selectedValue) {
        const [category, title] = selectedValue.split("-");
        errorCount = 0;
        currentPoemTitle = title;
        memorizationText = poems[category][title];
        startPractice();
    } else {
        memorizationText = "";
        sentences = [];
        memorizedSentencesDiv.innerText = sentences[0].text + sentences[0].punctuation;
        currentSentenceDiv.innerText = "";
        document.getElementById("word-options").innerHTML = "";
        document.getElementById("message").innerText = "";
    }
}

function startPractice() {
    // 包含所有中文标点
    const splitRegex = /([，。！？；：“”‘’—（）【】、])/;
    const tempParts = memorizationText.split(splitRegex);

    sentences = [];
    let currentText = "";
    
    // 重构处理逻辑
    tempParts.forEach((part, index) => {
        if (index % 2 === 0) {
            // 偶数索引为文本内容
            currentText = part.trim();
        } else {
            // 奇数索引为标点符号
            if (currentText) {
                sentences.push({
                    text: currentText,
                    punctuation: part // 保留原始标点
                });
                currentText = "";
            }
        }
    });

    // 处理最后未闭合的文本
    if (currentText) {
        sentences.push({
            text: currentText,
            punctuation: ""
        });
    }

    // console.log("分割结果：", sentences);

    if (sentences.length > 0) {
        memorizedSentencesDiv.innerText = sentences[0].text + sentences[0].punctuation;
        currentSentenceIndex = 1;
        if (sentences.length > 1) {
            currentWordIndex = 0;
            currentSentenceWords = sentences[currentSentenceIndex].text.split(""); // 使用text而非整个句子
            displayedWords = [];
            displayNextWordOptions();
        } else {
            currentSentenceDiv.innerText = "课文只有一句。";
            document.getElementById("word-options").innerHTML = "";
        }
    } else {
        currentSentenceDiv.innerText = "选必下背诵篇目正在更新，请耐心等待。-yansir";
    }
}

function displayNextWordOptions() {
    const wordOptionsDiv = document.getElementById("word-options");
    const messageDiv = document.getElementById("message");
    messageDiv.innerText = "";
    wordOptionsDiv.innerHTML = "";

    currentSentenceDiv.innerText = displayedWords.join("");

    if (currentWordIndex >= currentSentenceWords.length) {
        memorizedSentencesDiv.innerText += sentences[currentSentenceIndex].text + sentences[currentSentenceIndex].punctuation;
        currentSentenceIndex++;
        if (currentSentenceIndex < sentences.length) {
            currentSentenceWords = sentences[currentSentenceIndex].text.split("");
            currentWordIndex = 0;
            displayedWords = [];
            setTimeout(displayNextWordOptions, 10); // 异步调用避免递归过深
        } else {
            currentSentenceDiv.innerText = `本篇课文背诵完毕！错误次数：${errorCount}`;
        }
        return; // 立即结束当前执行
    }

    // 正常显示选项的逻辑
    const correctWord = currentSentenceWords[currentWordIndex];
    const incorrectWords = generateIncorrectWords();
    const options = [
        { text: correctWord, correct: true },
        { text: incorrectWords[0], correct: false },
        { text: incorrectWords[1], correct: false }
    ].sort(() => Math.random() - 0.5);

    options.forEach(option => {
        const button = document.createElement("button");
        button.innerText = option.text;
        button.classList.add("option-button");
        button.onclick = () => checkAnswer(option);
        wordOptionsDiv.appendChild(button);
    });
}

function generateIncorrectWords() { // 修改函数名和返回值结构
    const allChars = memorizationText.replace(/[，。？！：；、.?!:;]/g, '');
    let incorrectWords = []; // 改为数组存储两个干扰字
    while (incorrectWords.length < 2) { // 循环生成两个不同的干扰字
            const randomIndex = Math.floor(Math.random() * allChars.length);
            const char = allChars[randomIndex];
            if (char !== currentSentenceWords[currentWordIndex] && !incorrectWords.includes(char)) {
            incorrectWords.push(char);
        }
    }
    return incorrectWords;
}   

function checkAnswer(selectedOption) {
    const wordOptionsDiv = document.getElementById("word-options");
    const messageDiv = document.getElementById("message");
    const correctWord = currentSentenceWords[currentWordIndex];

    wordOptionsDiv.querySelectorAll('.option-button').forEach(button => {
        button.disabled = true;
        if (button.innerText === selectedOption.text) {
            button.classList.add(selectedOption.correct ? "correct" : "incorrect");
        } else if (button.innerText === correctWord) {
            button.classList.add("correct");
        }
    });

    if (selectedOption.correct) {
        displayedWords.push(selectedOption.text);
        currentWordIndex++;
        setTimeout(displayNextWordOptions, 300);
    } else {
        errorCount++;
        messageDiv.innerText = `错了，请点击正确的字继续。`;
        wordOptionsDiv.querySelectorAll('.option-button').forEach(button => {
            if (button.innerText === correctWord) {
                button.onclick = () => {
                    displayedWords.push(correctWord);
                    currentWordIndex++;
                    setTimeout(displayNextWordOptions, 300);
                };
                button.disabled = false;
            }
        });
    }
}

// Initial state: Poem select should be hidden
poemSelectContainer.style.display = "none";
// add start
function toggleNightMode() {
    document.body.classList.toggle('night-mode');
    const isNight = document.body.classList.contains('night-mode');
    localStorage.setItem('nightMode', isNight);
    event.target.textContent = isNight ? '☀️' : '🌙';
}

// 页面加载时检查设置
document.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('nightMode') === 'true';
    if (savedMode) {
        document.body.classList.add('night-mode');
        document.querySelector('[onclick="toggleNightMode()"]').textContent = '☀️';
    }
});