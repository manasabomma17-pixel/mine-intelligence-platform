"""
Production analytics using official Ministry of Coal data.

Reads coal production data from:
backend/data/coal_production.xlsx

Source:
Coal Directory of India 2024-25
Ministry of Coal, Government of India
"""

from pathlib import Path

import numpy as np
import pandas as pd


# ---------------------------------------------------------
# DATA SOURCE
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "coal_production.xlsx"


def load_production_data():
    """
    Load India's annual raw coal production from PT1.

    Values are in Million Tonnes (MT).
    """

    df = pd.read_excel(
        DATA_FILE,
        sheet_name="PT1",
        header=None,
    )

    # Locate the row containing "Raw Coal"
    data = []

    for _, row in df.iterrows():
        values = row.tolist()

        # Look for financial year values such as 2021-22
        for i, value in enumerate(values):
            if isinstance(value, str) and "-" in value:
                year = value.strip()

                if year in [
                    "2015-16",
                    "2016-17",
                    "2017-18",
                    "2018-19",
                    "2019-20",
                    "2020-21",
                    "2021-22",
                    "2022-23",
                    "2023-24",
                    "2024-25",
                ]:
                    try:
                        raw_coal = float(values[i + 1])
                        data.append(
                            {
                                "year": year,
                                "production": raw_coal,
                            }
                        )
                    except (ValueError, TypeError, IndexError):
                        pass

    # Remove duplicates while preserving order
    seen = set()
    cleaned = []

    for item in data:
        if item["year"] not in seen:
            seen.add(item["year"])
            cleaned.append(item)

    return cleaned


# Load once when the backend starts
PRODUCTION_DATA = load_production_data()

YEARS = [item["year"] for item in PRODUCTION_DATA]
ACTUAL = [item["production"] for item in PRODUCTION_DATA]

MINES = ["India"]


# ---------------------------------------------------------
# PRODUCTION
# ---------------------------------------------------------

def production_series():
    """
    Return official all-India raw coal production.
    """

    return {
        "mine": "India",
        "years": YEARS,
        "actual": ACTUAL,
        "target": None,
        "current": ACTUAL[-1],
        "target_current": None,
        "unit": "Million Tonnes",
    }


# ---------------------------------------------------------
# PERCENTAGE CHANGE
# ---------------------------------------------------------

def _pct_change(series):
    deltas = []

    for i in range(1, len(series)):
        previous = series[i - 1]
        current = series[i]

        pct = (
            round(((current - previous) / previous) * 100, 2)
            if previous
            else 0
        )

        deltas.append(
            {
                "year": YEARS[i],
                "changePct": pct,
            }
        )

    return deltas


# ---------------------------------------------------------
# ANOMALY DETECTION
# ---------------------------------------------------------

def anomalies():
    """
    Detect unusual year-over-year production changes.

    Uses z-score analysis on annual percentage changes.
    """

    deltas = _pct_change(ACTUAL)

    changes = np.array(
        [item["changePct"] for item in deltas],
        dtype=float,
    )

    results = []

    if len(changes) >= 2:

        mean = changes.mean()
        std = changes.std()

        for item in deltas:

            z_score = (
                abs((item["changePct"] - mean) / std)
                if std
                else 0
            )

            if abs(item["changePct"]) > 10:
                severity = "High"
            elif z_score > 1:
                severity = "Medium"
            else:
                severity = "Low"

            results.append(
                {
                    **item,
                    "severity": severity,
                }
            )

    # Find largest absolute production change
    primary = max(
        results,
        key=lambda x: abs(x["changePct"]),
    ) if results else None

    if primary:

        explanation = (
            f"India's raw coal production changed by "
            f"{primary['changePct']}% in {primary['year']} "
            f"compared with the previous financial year."
        )

        primary_result = {
            "id": 1,
            "title": f"Production Change — India",
            "severity": primary["severity"],
            "metric": "Raw Coal Production",
            "year": primary["year"],
            "change": f"{primary['changePct']}%",
            "explanation": explanation,
            "documentRef": "Coal Directory of India 2024-25",
        }

    else:
        primary_result = None

    return {
        "mine": "India",
        "anomalies": results,
        "primary": primary_result,
    }


# ---------------------------------------------------------
# FORECAST
# ---------------------------------------------------------

def forecast(horizon=3):
    """
    Linear trend forecast based on historical
    official raw coal production.
    """

    x = np.arange(len(ACTUAL), dtype=float)
    y = np.array(ACTUAL, dtype=float)

    slope, intercept = np.polyfit(x, y, 1)

    predicted_history = slope * x + intercept
    residuals = y - predicted_history

    std = residuals.std()

    future_x = np.arange(
        len(ACTUAL),
        len(ACTUAL) + horizon,
        dtype=float,
    )

    values = [
        round(slope * point + intercept, 2)
        for point in future_x
    ]

    band = abs(round(std * 1.5, 2))

    years_f = []

    last_year = int(YEARS[-1][:4])

    for i in range(1, horizon + 1):
        years_f.append(f"{last_year + i}-{str(last_year + i + 1)[-2:]}")

    return {
        "mine": "India",
        "horizon": horizon,
        "years": years_f,
        "values": values,
        "lower": [round(v - band, 2) for v in values],
        "upper": [round(v + band, 2) for v in values],
        "method": "Linear trend from official historical production",
        "note": (
            "Prototype forecast generated from historical "
            "Ministry of Coal production data."
        ),
        "unit": "Million Tonnes",
    }


# ---------------------------------------------------------
# KPIs
# ---------------------------------------------------------

def kpis():
    """
    Calculate dashboard KPI values from official data.
    """

    current = ACTUAL[-1]
    previous = ACTUAL[-2]

    change_pct = (
        round(((current - previous) / previous) * 100, 2)
        if previous
        else 0
    )

    anomaly_data = anomalies()

    anomaly_count = sum(
        1
        for item in anomaly_data["anomalies"]
        if item["severity"] in ("High", "Medium")
    )

    return {
        "currentProduction": current,
        "target": None,
        "changePct": change_pct,
        "anomalies": anomaly_count,
        "currentYear": YEARS[-1],
        "unit": "Million Tonnes",
    }


def state_production():
    df = pd.read_excel(DATA_FILE, sheet_name="PT25", header=None)

    rows = []

    for _, row in df.iloc[5:15].iterrows():
        state = row.iloc[0]

        if pd.isna(state) or state == "All India":
            continue

        production = row.iloc[12]

        if pd.isna(production):
            production = 0

        rows.append({
            "state": str(state).strip(),
            "production": round(float(production), 6),
            "unit": "Million Tonnes",
            "year": "2024-25",
        })

    return rows

