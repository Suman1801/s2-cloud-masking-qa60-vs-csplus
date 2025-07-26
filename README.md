# 🌥️ Sentinel-2 Cloud Masking Comparison: QA60 vs CloudScore+ (Barasat, India)

This project compares two cloud masking methods — **QA60** and **CloudScore+** — for Sentinel-2 Harmonized imagery using **Google Earth Engine (GEE)**. The objective is to demonstrate and quantify the performance differences of these masks over a selected Sentinel-2 image covering **Barasat, West Bengal, India**, for the time range **January–July 2025**.

---

## 🗺️ Objective

To perform **cloud masking** on a high-cloud Sentinel-2 image using:
1. `QA60` Bitmask-based masking (official ESA method)
2. `CloudScore+` Machine-learning-based masking (by Google Earth Engine)

We then:
- Visualize original and masked images
- Generate binary cloud masks
- Compare total vs. clear-sky areas
- Export all results for local analysis

---

## 📍 Study Area and Dataset

- **Location**: Barasat, West Bengal  
- **Coordinates**: `[88.518, 22.719]`
- **Dataset**: `COPERNICUS/S2_HARMONIZED` (Sentinel-2 Surface Reflectance)
- **Time Frame**: `2025-01-01` to `2025-07-01`
- **Cloud Threshold**: 35%

---

## 🛠️ Cloud Masking Methodologies

### 1. **QA60 Cloud Masking (Bitmask)**

- **Band Used**: `QA60` (Quality Assurance)
- **Cloud Bits**:
  - Bit 10: opaque clouds
  - Bit 11: cirrus clouds
- **Approach**:
  - Bitwise operations identify pixels flagged as cloud or cirrus.
  - These are masked (set to 0) to retain only clear pixels.

📚 **Source**:  
- [ESA Sentinel-2 MSI Level-1C Product Definition](https://sentinel.esa.int/documents/247904/685211/Sentinel-2-MSIL1C-ProductDefinition.pdf)
- [GEE Docs - Sentinel-2 QA60](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2)

---

### 2. **CloudScore+ (Machine Learning)**

- **Dataset**: `GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED`
- **Band Used**: `cs` (cloud score: 0 to 1)
- **Approach**:
  - Probabilistic scoring using deep learning (CNN models).
  - Pixels with `cs >= 0.2` are considered **clear**.
  - This method uses spatial patterns, temporal history, and spectral data.

📚 **Source**:  
- [Google CloudScore+ Dataset Description](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_CLOUD_SCORE_PLUS_V1_S2_HARMONIZED)

---

## 🧮 Comparison of QA60 vs CloudScore+

| Criteria                | QA60                         | CloudScore+                    |
|------------------------|------------------------------|--------------------------------|
| Method Type            | Bitmask (Boolean QA band)    | Machine Learning (CNN)         |
| Data Band              | `QA60`                       | `cs`                           |
| Masking Accuracy       | Lower (often over-masks)     | Higher (fewer false positives) |
| Transparency Handling  | No                           | Yes                            |
| Flexibility            | Fixed thresholds             | User-defined thresholds        |
| Computational Speed    | Faster                       | Slightly Slower                |
| GEE Native Support     | ✅                            | ✅                             |

---

## 📊 Area-Based Comparison

Pixel-wise statistics were computed:

- **Cloud-Free Area** (m²)
- **Total Area** (m²)
- **% Clear Pixels**

Using `ee.Image.pixelArea()` and `.reduceRegion()`.

---

## 📤 Exports (to Google Drive)

- `S2_Original_Barasat_2025`
- `S2_QA60_Masked_Barasat_2025`
- `S2_CSPlus_Masked_Barasat_2025`
- `QA60_Binary_Mask_Barasat_2025`
- `CSPlus_Binary_Mask_Barasat_2025`

---

## 📌 Important Notes

- The **QA60 bitmask** tends to **overestimate clouds**, often masking shadows or water as clouds.
- **CloudScore+** leverages deep learning to detect true clouds more precisely but may require tuning for thresholds (we used `0.2`).
- This code can be modified to loop over time ranges or multiple AOIs.

---

## 🧑‍💻 Author

**Suman Bhowmick**  
M.Sc. in Geography | Researcher | GEE & Python Developer  
📧: sumanbhowmick768@gmail.com  

---

## ⚖️ License

This project is licensed under the MIT License. You are free to reuse, modify, and share with credit.

---

