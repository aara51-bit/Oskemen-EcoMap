const stations = new Array(
    { id: 1, name: "🏭 Өндірістік аймақ (ҮМЗ / Казцинк)", x: 840, y: 230, aqi: 168, pm25: 89, color: "red", fill: "#ef4444", statusText: "Қауіпті деңгей", statusClass: "status-red", info: "Зиянды қалдықтар деңгейі жоғары. Маска тағу ұсынылады." },
    { id: 2, name: "🏘️ Защита ауданы", x: 400, y: 480, aqi: 152, pm25: 74, color: "red", fill: "#ef4444", statusText: "Ластанған", statusClass: "status-red", info: "Желсіз күндері түтін жиналатын аймақ." },
    { id: 3, name: "🏭 Согра ауданы", x: 1240, y: 260, aqi: 135, pm25: 65, color: "red", fill: "#ef4444", statusText: "Ластанған", statusClass: "status-red", info: "Ауа сапасы нашар (PM2.5 жоғары)." },
    { id: 4, name: "🏙️ Қала орталығы (Стрелка)", x: 980, y: 620, aqi: 85, pm25: 32, color: "orange", fill: "#f59e0b", statusText: "Орташа", statusClass: "status-yellow", info: "Негізгі себеп: автокөлік кептелісі." },
    { id: 5, name: "🏢 Жібек маталар комбинаты (КШТ)", x: 680, y: 900, aqi: 62, pm25: 24, color: "orange", fill: "#f59e0b", statusText: "Қанағаттанарлық", statusClass: "status-yellow", info: "Ауа сапасы қалыпты шекте." },
    { id: 6, name: "🌲 Меновное / Сол жағалау", x: 340, y: 820, aqi: 38, pm25: 11, color: "green", fill: "#22c55e", statusText: "Таза ауа", statusClass: "status-green", info: "Ауа таза, серуендеуге қолайлы." },
    { id: 7, name: "⛰️ Аблакетка ауданы", x: 1320, y: 900, aqi: 42, pm25: 14, color: "green", fill: "#22c55e", statusText: "Таза ауа", statusClass: "status-green", info: "Тау бөктеріндегі таза аймақ." }
);

const svgNS = "http://w3.org";
const svgMap = document.getElementById("oskemen-svg");
const viewport = document.getElementById("viewport");
const stationsLayer = document.getElementById("stations-layer");
const reportsLayer = document.getElementById("reports-layer");
const infoBox = document.getElementById("map-info-box");

let scale = 1, translateX = 0, translateY = 0, isDragging = false, hasMoved = false, startX = 0, startY = 0;

function updateTransform(smooth = false) {
    viewport.style.transition = smooth ? "transform 0.4s ease" : "none";
    viewport.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(${scale})`);
}

function zoomMap(delta) {
    const newScale = Math.min(Math.max(scale + delta, 0.6), 3);
    translateX = 800 - (800 - translateX) * (newScale / scale);
    translateY = 600 - (600 - translateY) * (newScale / scale);
    scale = newScale;
    updateTransform(true);
}

function resetMap() {
    scale = 1; translateX = 0; translateY = 0;
    updateTransform(true);
}

function flyToPoint(x, y) {
    scale = 1.6;
    translateX = 800 - x * scale;
    translateY = 600 - y * scale;
    updateTransform(true);
}

svgMap.addEventListener("mousedown", (e) => { isDragging = true; hasMoved = false; startX = e.clientX; startY = e.clientY; });

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved = true;
    const rect = svgMap.getBoundingClientRect();
    translateX += dx * (1600 / rect.width);
    translateY += dy * (1200 / rect.height);
    startX = e.clientX; startY = e.clientY;
    updateTransform(false);
});

window.addEventListener("mouseup", () => { isDragging = false; });

svgMap.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomMap(e.deltaY < 0 ? 0.15 : -0.15);
}, { passive: false });

function showPopup(title, content, borderColor = "#0284c7") {
    infoBox.style.display = "block";
    infoBox.style.borderLeftColor = borderColor;
    infoBox.innerHTML = `<button class="close-btn" onclick="infoBox.style.display='none'">✖</button><h3>${title}</h3>${content}`;
}

function renderData(filterColor) {
    stationsLayer.innerHTML = "";
    const listContainer = document.getElementById("station-list");
    listContainer.innerHTML = "";

    stations.forEach(st => {
        if (filterColor === "all" || st.color === filterColor) {
            const group = document.createElementNS(svgNS, "g");
            group.setAttribute("class", "station-marker");

            const outerCircle = document.createElementNS(svgNS, "circle");
            outerCircle.setAttribute("cx", st.x); outerCircle.setAttribute("cy", st.y); outerCircle.setAttribute("r", "34"); outerCircle.setAttribute("fill", st.fill); outerCircle.setAttribute("opacity", "0.25");

            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", st.x); circle.setAttribute("cy", st.y); circle.setAttribute("r", "22"); circle.setAttribute("fill", st.fill); circle.setAttribute("stroke", "#ffffff"); circle.setAttribute("stroke-width", "4");

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", st.x); text.setAttribute("y", st.y + 5); text.setAttribute("text-anchor", "middle"); text.setAttribute("fill", "#ffffff"); text.setAttribute("font-size", "15"); text.setAttribute("font-weight", "bold");
            text.textContent = st.aqi;

            group.appendChild(outerCircle); group.appendChild(circle); group.appendChild(text);

            group.addEventListener("mouseup", (e) => {
                if (hasMoved) return;
                e.stopPropagation();
                flyToPoint(st.x, st.y);
                showPopup(st.name, `<p>AQI көрсеткіші: <b>${st.aqi}</b> (${st.statusText})</p><p>PM2.5 шаңы: <b>${st.pm25} мкг/м³</b></p><p style="margin-top:6px; color:#475569;">${st.info}</p>`, st.fill);
            });

            stationsLayer.appendChild(group);

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `<h3>${st.name}</h3><p style="font-size: 13px;">AQI: <span class="${st.statusClass}">${st.aqi} (${st.statusText})</span></p><p style="font-size: 12px; color: #64748b; margin-top: 3px;">PM2.5: ${st.pm25} мкг/м³</p>`;

            card.onclick = () => {
                document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
                flyToPoint(st.x, st.y);
                showPopup(st.name, `<p>AQI көрсеткіші: <b>${st.aqi}</b> (${st.statusText})</p><p>PM2.5 шаңы: <b>${st.pm25} мкг/м³</b></p><p style="margin-top:6px; color:#475569;">${st.info}</p>`, st.fill);
            };

            listContainer.appendChild(card);
        }
    });
}

function filterStations(color, btn) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderData(color);
}

renderData("all");

let savedReports = JSON.parse(localStorage.getItem("oskemen_reports") || "[]");

function drawReportBadge(x, y, text) {
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("style", "cursor: pointer;");

    const labelText = "📍 " + text;
    const boxWidth = Math.max(labelText.length * 9 + 24, 120);

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", x - boxWidth / 2);
    rect.setAttribute("y", y - 42);
    rect.setAttribute("width", boxWidth);
    rect.setAttribute("height", "32");
    rect.setAttribute("rx", "8");
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#ef4444");
    rect.setAttribute("stroke-width", "2.5");

    const pointer = document.createElementNS(svgNS, "polygon");
    pointer.setAttribute("points", `${x - 6},${y - 10} ${x + 6},${y - 10} ${x},${y}`);
    pointer.setAttribute("fill", "#ef4444");

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y - 21);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#0f172a");
    label.setAttribute("font-size", "14");
    label.setAttribute("font-weight", "bold");
    label.textContent = labelText;

    group.appendChild(rect);
    group.appendChild(pointer);
    group.appendChild(label);

    group.addEventListener("mouseup", (ev) => {
        if (hasMoved) return;
        ev.stopPropagation();
        showPopup("⚠️ Тұрғын шағымы", `<p><b>Мәселе:</b> ${text}</p><p><small>Картада тіркелген</small></p>`, "#dc2626");
    });

    reportsLayer.appendChild(group);
}

savedReports.forEach(rep => drawReportBadge(rep.x, rep.y, rep.text));

svgMap.addEventListener("click", function(e) {
    if (hasMoved) return;
    const rect = svgMap.getBoundingClientRect();
    const x = (((e.clientX - rect.left) / rect.width) * 1600 - translateX) / scale;
    const y = (((e.clientY - rect.top) / rect.height) * 1200 - translateY) / scale;

    const problem = prompt("Бұл жерде қандай экологиялық мәселе бар? (Мысалы: Қою түтін, өткір иіс, қоқыс):");
    if (problem && problem.trim() !== "") {
        const cleanText = problem.trim();
        drawReportBadge(x, y, cleanText);
        savedReports.push({ x: x, y: y, text: cleanText });
        localStorage.setItem("oskemen_reports", JSON.stringify(savedReports));
        showPopup("⚠️ Тұрғын шағымы қосылды", `<p>${cleanText}</p>`, "#dc2626");
    }
});

function renderChart() {
    const chartContainer = document.getElementById("custom-chart");
    const values = new Array(95, 110, 145, 160, 130, 85, 70);
    const days = new Array("Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жк");
    let barsHTML = `<svg viewBox="0 0 320 130" style="width:100%; height:auto;">`;
    values.forEach((val, i) => {
        const barHeight = (val / 200) * 90;
        const x = 15 + i * 43;
        const y = 105 - barHeight;
        let color = "#22c55e";
        if (val > 100) {
            color = "#ef4444";
        } else if (val > 50) {
            color = "#f59e0b";
        }
        barsHTML += `<rect x="${x}" y="${y}" width="26" height="${barHeight}" rx="4" fill="${color}" />`;
        barsHTML += `<text x="${x + 13}" y="${y - 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#334155">${val}</text>`;
        barsHTML += `<text x="${x + 13}" y="122" text-anchor="middle" font-size="11" fill="#64748b">${days.at(i)}</text>`;
    });
    barsHTML += `</svg>`;
    chartContainer.innerHTML = barsHTML;
}

renderChart();