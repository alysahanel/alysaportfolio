document.addEventListener('DOMContentLoaded', () => {
    // --- Navbar Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
                navLinks.style.zIndex = '1000';
            }
        });
    }

    // --- 1. Symptom Diagnosis ---
    const diagnosisForm = document.getElementById('diagnosis-form');
    const diagnosisResult = document.getElementById('diagnosis-result');
    const conditionText = document.getElementById('condition-text');

    if (diagnosisForm) {
        diagnosisForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked'))
                .map(cb => cb.value);

            let diagnosis = "Based on your symptoms, we recommend consulting a general practitioner.";

            // Simple rule-based logic
            if (symptoms.length === 0) {
                diagnosis = "Please select at least one symptom.";
            } else if (symptoms.includes('fever') && symptoms.includes('cough') && symptoms.includes('shortness_breath')) {
                diagnosis = "Possible Respiratory Infection (e.g., Pneumonia, COVID-19). Please seek medical attention immediately.";
            } else if (symptoms.includes('headache') && symptoms.includes('nausea') && symptoms.includes('dizziness')) {
                diagnosis = "Possible Migraine or Vertigo. Rest in a dark, quiet room and stay hydrated.";
            } else if (symptoms.includes('fever') && symptoms.includes('sore_throat')) {
                diagnosis = "Possible Strep Throat or Tonsillitis. Gargle with warm salt water and see a doctor.";
            } else if (symptoms.includes('fatigue') && symptoms.includes('dizziness')) {
                diagnosis = "Possible Anemia or Dehydration. Drink plenty of water and rest.";
            } else if (symptoms.includes('headache') && symptoms.length === 1) {
                diagnosis = "Potential Stress or Tension Headache. Try to relax and reduce screen time.";
            } else if (symptoms.includes('nausea') && symptoms.includes('dizziness') && symptoms.length === 2) {
                diagnosis = "Potential Motion Sickness or Food Poisoning. Stay hydrated.";
            } else {
                diagnosis = "Symptoms are non-specific. Please monitor your condition and consult a doctor if symptoms persist.";
            }

            conditionText.textContent = diagnosis;
            diagnosisResult.classList.remove('hidden');
        });
    }

    // --- 2. Treatment Recommendations ---
    const treatmentSearch = document.getElementById('treatment-search');
    const searchBtn = document.getElementById('search-btn');
    const treatmentResult = document.getElementById('treatment-result');
    const treatmentTitle = document.getElementById('treatment-title');
    const treatmentDesc = document.getElementById('treatment-desc');

    const treatments = {
        'flu': "Rest, drink plenty of fluids, and take over-the-counter fever reducers. Consult a doctor if symptoms worsen.",
        'headache': "Rest in a quiet room, stay hydrated, and consider over-the-counter pain relief like Ibuprofen or Paracetamol.",
        'migraine': "Rest in a dark room, apply cool compresses, and take prescribed migraine medication or pain relievers.",
        'acne': "Keep skin clean, avoid popping pimples, and use over-the-counter creams containing benzoyl peroxide or salicylic acid.",
        'burn': "Cool the burn with cool (not cold) running water for 10-20 minutes. Cover with a sterile, non-fluffy dressing.",
        'fever': "Rest and drink fluids. Medication like Acetaminophen or Ibuprofen can help lower fever.",
        'cough': "Stay hydrated, use cough drops, and consider honey or over-the-counter cough suppressants.",
        'stomach ache': "Avoid solid foods for a few hours, sip water or clear fluids, and rest.",
        'diabetes': "Manage blood sugar levels through diet, exercise, and medication (insulin or oral) as prescribed by a doctor.",
        'hypertension': "Adopt a healthy diet with less salt, exercise regularly, maintain a healthy weight, and take prescribed medication.",
        'insomnia': "Maintain a regular sleep schedule, avoid caffeine late in the day, and create a relaxing bedtime routine."
    };

    function performSearch(query) {
        if (!query) return;
        
        query = query.toLowerCase().trim();
        let result = "No specific treatment found for this condition. Please consult a doctor.";
        let title = "Result";
        let found = false;

        // Direct match or partial match
        for (const [key, value] of Object.entries(treatments)) {
            if (query.includes(key) || key.includes(query)) {
                title = key.charAt(0).toUpperCase() + key.slice(1);
                result = value;
                found = true;
                break;
            }
        }

        if (!found && query.length > 0) {
            title = "Not Found";
            result = "We couldn't find a specific treatment for '" + query + "'. Please consult a healthcare professional.";
        }

        treatmentTitle.textContent = title;
        treatmentDesc.textContent = result;
        treatmentResult.classList.remove('hidden');
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch(treatmentSearch.value);
        });
    }
    
    // Allow 'Enter' key in search box
    if (treatmentSearch) {
        treatmentSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(treatmentSearch.value);
            }
        });
    }

    // Global function for Quick Tags
    window.searchTreatment = (term) => {
        if (treatmentSearch) {
            treatmentSearch.value = term;
            performSearch(term);
        }
    };


    // --- 3. Diabetes Risk Assessment ---
    const diabetesForm = document.getElementById('diabetes-form');
    const diabetesResult = document.getElementById('diabetes-result');
    const riskScoreDisplay = document.getElementById('risk-score');
    const riskLevelDisplay = document.getElementById('risk-level');
    const riskAdviceDisplay = document.getElementById('risk-advice');

    if (diabetesForm) {
        diabetesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const ageScore = parseInt(document.getElementById('diabetes-age').value);
            const bmiScore = parseInt(document.getElementById('diabetes-bmi').value);
            const familyScore = parseInt(document.getElementById('diabetes-family').value);
            const exerciseScore = parseInt(document.getElementById('diabetes-exercise').value);
            
            const totalScore = ageScore + bmiScore + familyScore + exerciseScore;
            
            let riskLevel = "Low Risk";
            let advice = "Maintain your healthy lifestyle!";
            let color = "#2ecc71"; // Green

            if (totalScore >= 10) {
                riskLevel = "High Risk";
                advice = "You are at high risk. Please consult a doctor for a screening immediately.";
                color = "#e74c3c"; // Red
            } else if (totalScore >= 5) {
                riskLevel = "Moderate Risk";
                advice = "You are at moderate risk. Consider improving your diet and exercise routine.";
                color = "#f1c40f"; // Yellow
            }

            riskScoreDisplay.textContent = totalScore;
            riskLevelDisplay.textContent = riskLevel;
            riskLevelDisplay.style.color = color;
            riskAdviceDisplay.textContent = advice;
            
            diabetesResult.classList.remove('hidden');
        });
    }


    // --- 4. BMI Calculator ---
    const bmiForm = document.getElementById('bmi-form');
    const bmiResult = document.getElementById('bmi-result');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');

    if (bmiForm) {
        bmiForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value) / 100; // Convert cm to m

            if (weight > 0 && height > 0) {
                const bmi = (weight / (height * height)).toFixed(1);
                
                let category = '';
                let color = '';

                if (bmi < 18.5) {
                    category = 'Underweight';
                    color = '#f1c40f'; // Yellow
                } else if (bmi >= 18.5 && bmi < 24.9) {
                    category = 'Normal weight';
                    color = '#2ecc71'; // Green
                } else if (bmi >= 25 && bmi < 29.9) {
                    category = 'Overweight';
                    color = '#e67e22'; // Orange
                } else {
                    category = 'Obesity';
                    color = '#e74c3c'; // Red
                }

                bmiValue.textContent = bmi;
                bmiCategory.textContent = category;
                bmiCategory.style.color = color;
                bmiCategory.style.fontWeight = 'bold';
                
                bmiResult.classList.remove('hidden');
            } else {
                alert('Please enter valid weight and height values.');
            }
        });
    }
});
