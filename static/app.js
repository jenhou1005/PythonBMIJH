const form = document.querySelector(".calculator form");
const heightInput = document.querySelector("#height");
const weightInput = document.querySelector("#weight");
const resultPanel = document.querySelector(".result-panel");
const bmiValue = document.querySelector("#bmi-value");
const gaugeNeedle = document.querySelector("#gauge-needle");
const gauge = document.querySelector("#bmi-gauge");
const resultStatus = document.querySelector("#result-status");
const resultAdvice = document.querySelector("#result-advice");
const riskNote = document.querySelector("#risk-note");
const resultRisk = document.querySelector("#result-risk");

let debounceTimer;
let currentRequest;

function clearErrors() {
  for (const input of [heightInput, weightInput]) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    document.querySelector(`#${input.id}-error`)?.remove();
  }
}

function showErrors(errors) {
  clearErrors();
  for (const [field, message] of Object.entries(errors)) {
    const input = document.querySelector(`#${field}`);
    if (!input) continue;

    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", `${field}-error`);
    const error = document.createElement("p");
    error.className = "field-error";
    error.id = `${field}-error`;
    error.textContent = message;
    input.closest(".field").append(error);
  }
  resultStatus.textContent = "請修正輸入欄位後再計算。";
}

function resetResult(message = "輸入身高與體重，即時查看 BMI 位置") {
  resultPanel.className = "result-panel";
  bmiValue.textContent = "—";
  gaugeNeedle.hidden = true;
  resultStatus.textContent = message;
  resultAdvice.textContent = "完成輸入後，這裡會提供適合你目前體位的建議。";
  riskNote.hidden = true;
  resultRisk.textContent = "";
  gauge.setAttribute("aria-label", "BMI 儀表，輸入身高與體重後顯示目前位置");
}

function showResult(result) {
  resultPanel.className = `result-panel ${result.tone}`;
  bmiValue.textContent = result.bmi;
  gaugeNeedle.setAttribute(
    "transform",
    `rotate(${result.angle}, 150, 150)`,
  );
  gaugeNeedle.hidden = false;
  resultStatus.replaceChildren(
    document.createTextNode("你的體位屬於 "),
    Object.assign(document.createElement("strong"), {
      textContent: result.label,
    }),
  );
  resultAdvice.textContent = result.advice;
  resultRisk.textContent = result.risk;
  riskNote.hidden = false;
  gauge.setAttribute("aria-label", `BMI ${result.bmi}，${result.label}`);
}

async function calculate() {
  const height = heightInput.value.trim();
  const weight = weightInput.value.trim();
  if (!height || !weight) {
    resetResult();
    return;
  }

  currentRequest = new AbortController();
  try {
    const response = await fetch("/api/bmi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ height, weight }),
      signal: currentRequest.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      resetResult();
      showErrors(data.errors || { height: data.error || "無法計算 BMI，請檢查輸入資料。" });
      return;
    }

    clearErrors();
    showResult(data);
  } catch (error) {
    if (error.name === "AbortError") return;
    resetResult("即時計算暫時無法連線，請稍後再試或送出表單計算。");
  }
}

form.addEventListener("input", (event) => {
  if (event.target !== heightInput && event.target !== weightInput) return;

  clearTimeout(debounceTimer);
  currentRequest?.abort();
  clearErrors();
  if (!heightInput.value.trim() || !weightInput.value.trim()) {
    resetResult();
    return;
  }

  resultStatus.textContent = "正在更新 BMI…";
  debounceTimer = setTimeout(calculate, 180);
});
