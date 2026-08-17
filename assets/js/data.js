/**
 * data.js — single source of truth for every piece of content on the site.
 * Edit here; every section (and the AI assistant) re-renders from this object.
 */

const PROFILE = {
  "name": "Siddharth Adhikari",
  "fullName": "Siddharth Shivprasad Adhikari",
  "initials": "SA",
  "role": "Data Scientist",
  "roleAlternates": [
    "Data Scientist",
    "ML Engineer",
    "RAG & LLM Systems",
    "Analytics Engineer",
    "Data Analyst ",
    "Data Engineer",
    "MLOps Engineer",
    "LLMOps Engineer"
  ],
  "tagline": "I build the pipelines, models and retrieval systems that turn messy data into decisions people actually act on.",
  "summary": "MS in Data Science from University at Buffalo. Currently at ASM International building LLM-powered search and enrichment pipelines over 500K+ scientific documents.",
  "location": "Buffalo, NY · Open to relocation",
  "email": "siddharthadhikari.workspace@gmail.com",
  "phone": "+1 (716) 247-3639",
  "availability": "Open to Data Scientist / ML Engineer roles",
  "resume": "./assets/docs/Siddharth_Adhikari_Resume.pdf",
  "github": "siddhyaaddy",
  "links": {
    "github": "https://github.com/siddhyaaddy",
    "linkedin": "https://www.linkedin.com/in/siddharth-adhikari-40199b203/",
    "kaggle": "https://www.kaggle.com/siddharthadhikari07",
    "email": "mailto:siddharthadhikari.workspace@gmail.com"
  },
  "metrics": [
    {
      "value": 500,
      "suffix": "K+",
      "label": "Documents indexed",
      "detail": "Scientific corpus at ASM International"
    },
    {
      "value": 93.5,
      "suffix": "%",
      "label": "Best model accuracy",
      "detail": "Fine-tuned DeBERTa-v3 on 50K+ samples",
      "decimals": 1
    },
    {
      "value": 60,
      "suffix": "%",
      "label": "Manual effort removed",
      "detail": "GitLab CI/CD automation"
    },
    {
      "value": 3.5,
      "suffix": "M+",
      "label": "Records processed",
      "detail": "NYC taxi pipeline on AWS Glue + Athena",
      "decimals": 1
    }
  ],
  "about": {
    "heading": "From raw tables to systems people trust",
    "paragraphs": [
      "I'm a data scientist with a Master's from the <strong>University at Buffalo</strong> and an engineering background from <strong>Savitribai Phule Pune University</strong>. My work sits where analytics meets production: ETL that doesn't silently break, models that survive contact with real users, and retrieval systems that give an answer someone can defend in a meeting.",
      "At <strong>ASM International</strong> I build the LLM enrichment and vector-search backbone behind Mat-E Pro — a RAG assistant over materials science literature. Before that, at <strong>Youro LLC</strong>, I worked directly with the CEO turning healthcare data into product decisions.",
      "I care about the unglamorous half of the job: schema design, cross-validation discipline, experiment tracking, and reporting that a non-technical stakeholder can read in thirty seconds."
    ],
    "highlights": [
      {
        "icon": "sparkles",
        "value": "RAG & LLM",
        "label": "Production retrieval pipelines"
      },
      {
        "icon": "database",
        "value": "ETL at scale",
        "label": "Python · SQL · AWS · Airflow-style DAGs"
      },
      {
        "icon": "chart",
        "value": "Experimentation",
        "label": "A/B testing, MLflow, cohort analysis"
      },
      {
        "icon": "users",
        "value": "Stakeholder-facing",
        "label": "Worked with CEOs and cross-functional teams"
      }
    ]
  },
  "stack": [
    "Python",
    "SQL",
    "PyTorch",
    "Hugging Face",
    "scikit-learn",
    "MLflow",
    "AWS",
    "Databricks",
    "Snowflake",
    "PySpark",
    "Docker",
    "GitLab CI",
    "OpenSearch",
    "FastAPI",
    "GitLab",
    "Streamlit",
    "Power BI",
    "Tableau",
    "MongoDB",
    "CloudFlare",
    "OpenSearch"
  ],
  "experience": [
    {
      "company": "ASM International",
      "role": "Data Science Intern",
      "period": "May 2026 — Present",
      "current": true,
      "location": "Remote / Hybrid",
      "blurb": "Building the data and LLM infrastructure behind AI-powered search across a half-million scientific documents.",
      "points": [
        "Engineered machine learning data pipelines for <strong>500K+ scientific documents</strong>, boosting OpenSearch index coverage by 35% and reducing data quality errors to significantly improve AI-powered search accuracy.",
        "Developed the <strong>Mat-E Pro RAG chatbot backend</strong> using natural language processing and LLM-powered enrichment pipelines, enabling automated metadata extraction across 10,000+ materials science documents at scale.",
        "Implemented <strong>CI/CD pipelines in GitLab</strong> to automate end-to-end data engineering workflows, reducing manual deployment effort by 60% and enabling fully automated vector search content indexing and retrieval."
      ],
      "tags": [
        "RAG",
        "LLM",
        "OpenSearch",
        "NLP",
        "GitLab CI/CD",
        "Python"
      ],
      "accent": "primary"
    },
    {
      "company": "Youro LLC",
      "role": "Data Science Intern",
      "period": "Feb 2026 — May 2026",
      "location": "Buffalo, NY",
      "blurb": "Healthcare data platform work — ETL, statistical analysis, and business intelligence reporting straight to the founder.",
      "points": [
        "Built <strong>ETL pipelines using Python and SQL</strong> for data wrangling and transformation of 2,000+ patient records, reducing data processing time by 35% and supporting AI-driven healthcare analytics workflows.",
        "Collaborated with <strong>3 cross-functional teams</strong> to develop SQL transformations and statistical analysis workflows, cutting data delivery time by 45% and improving reporting accuracy for healthcare platform teams.",
        "Partnered with the <strong>CEO</strong> to conduct business intelligence analysis on 5+ healthcare datasets, delivering actionable findings that directly influenced 3 key product strategy and operational planning decisions."
      ],
      "tags": [
        "ETL",
        "SQL",
        "Healthcare",
        "Business Intelligence",
        "Python"
      ],
      "accent": "cyan"
    },
    {
      "company": "NoZanZat",
      "role": "Data Science Intern",
      "period": "Sep 2023 — Feb 2024",
      "location": "Pune, India",
      "blurb": "Demand analytics and churn modelling for an operations-heavy consumer business.",
      "points": [
        "Analyzed historical customer order and usage data using Python and SQL to identify <strong>peak demand patterns</strong>, enabling staff allocation optimization and reducing operational idle time by approximately 20%.",
        "Developed and evaluated a <strong>churn prediction model</strong> using scikit-learn on customer retention data to flag at-risk users, improving targeted re-engagement outcomes and boosting overall retention by 12%.",
        "Designed and deployed <strong>Power BI dashboards</strong> tracking order volume, turnaround time, and repeat usage metrics, cutting manual reporting effort by 30% and improving visibility for leadership."
      ],
      "tags": [
        "Churn Modelling",
        "Power BI",
        "scikit-learn",
        "SQL"
      ],
      "accent": "violet"
    }
  ],
  "projects": [
    {
      "title": "SaaS Revenue & Retention Analytics",
      "period": "Dec 2025 — Jan 2026",
      "category": "Analytics",
      "summary": "End-to-end subscription analytics: MRR, churn, LTV and cohort retention across 10,000+ subscribers, plus a statistically-validated A/B testing program.",
      "points": [
        "SQL revenue models computing MRR, churn rate, LTV and cohort retention across 10,000+ subscribers.",
        "Cohort analysis surfacing 3 high-risk segments responsible for 60% of total churn.",
        "A/B testing with significance testing across 4 experiments — product experiment success rate up 25%."
      ],
      "stats": [
        {
          "k": "10K+",
          "v": "Subscribers"
        },
        {
          "k": "60%",
          "v": "Churn traced to 3 segments"
        },
        {
          "k": "+25%",
          "v": "Experiment success rate"
        }
      ],
      "tags": [
        "SQL",
        "Tableau",
        "A/B Testing",
        "Cohort Analysis",
        "Excel"
      ],
      "link": "https://github.com/siddhyaaddy/sentiment-wars",
      "accent": "amber",
      "featured": true
    },
    {
      "title": "Sentiment Wars — LLM vs. Classical ML",
      "period": "Jan 2025 — May 2025",
      "category": "NLP",
      "summary": "A controlled benchmark of 5 LLM and ML approaches on 50K+ text samples, with full MLflow experiment tracking and a fine-tuned transformer winner.",
      "points": [
        "Orchestrated an NLP and deep learning sentiment pipeline across 50K+ text samples, benchmarking 5 LLM versus ML models.",
        "Fine-tuned <strong>DeBERTa-v3-base</strong> to 93.5% accuracy, outperforming DistilBERT and XGBoost by 8%.",
        "MLflow tracking across 30+ model runs, accelerating model comparison cycles by 30%."
      ],
      "stats": [
        {
          "k": "93.5%",
          "v": "Accuracy"
        },
        {
          "k": "50K+",
          "v": "Text samples"
        },
        {
          "k": "30+",
          "v": "Tracked runs"
        }
      ],
      "tags": [
        "PyTorch",
        "Hugging Face",
        "DeBERTa-v3",
        "MLflow",
        "NLP"
      ],
      "link": "https://github.com/siddhyaaddy/sentiment-wars",
      "accent": "violet",
      "featured": true
    },
    {
      "title": "Rideflow Analytics",
      "period": "Apr 2025 — May 2025",
      "category": "Data Engineering",
      "summary": "Time-series demand forecasting over 3.5M+ NYC taxi trips, served through a Streamlit dashboard on an AWS-native pipeline.",
      "points": [
        "ML pipeline with time series forecasting on 3.5M+ NYC taxi trips — ETL time cut 40%, hourly demand insights to 50+ daily users.",
        "Normalized schema on AWS RDS with optimized SQL indexes — query latency down 25%.",
        "AWS Glue and Athena processing 3.5M+ records daily, reducing pipeline overhead by 40%."
      ],
      "stats": [
        {
          "k": "3.5M+",
          "v": "Trips/day"
        },
        {
          "k": "-40%",
          "v": "ETL time"
        },
        {
          "k": "-25%",
          "v": "Query latency"
        }
      ],
      "tags": [
        "AWS Glue",
        "Athena",
        "RDS",
        "Streamlit",
        "Time Series"
      ],
      "link": "https://github.com/siddhyaaddy/rideflow-analytics",
      "accent": "cyan",
      "featured": true
    },
    {
      "title": "NYC Taxi Demand Forecasting",
      "period": "2024 — 2025",
      "category": "Machine Learning",
      "summary": "Full end-to-end ML pipeline on NYC Yellow Taxi data (2023–2024): ingestion, feature store, LightGBM models and a live prediction dashboard.",
      "points": [
        "Ingestion → feature engineering → training → serving, wired as a reproducible pipeline.",
        "LightGBM models with hyperparameter search on lagged demand features.",
        "Real-time demand dashboard powered by Streamlit."
      ],
      "stats": [
        {
          "k": "2.3M",
          "v": "Data points"
        },
        {
          "k": "LightGBM",
          "v": "Best model"
        },
        {
          "k": "Hourly",
          "v": "Forecast horizon"
        }
      ],
      "tags": [
        "Python",
        "LightGBM",
        "AWS",
        "Streamlit",
        "Feature Store"
      ],
      "link": "https://github.com/siddhyaaddy/NYC_taxi",
      "accent": "primary"
    },
    {
      "title": "Virtual Trial Room",
      "period": "2023 — 2024",
      "category": "Computer Vision",
      "summary": "AR-powered virtual fitting room using pose estimation and garment segmentation. Work published as a research paper.",
      "points": [
        "Pose estimation to anchor garments to body keypoints in real time.",
        "Garment segmentation and warping for realistic overlay.",
        "Published research paper on the approach."
      ],
      "stats": [
        {
          "k": "Published",
          "v": "Research paper"
        },
        {
          "k": "Real-time",
          "v": "Pose tracking"
        },
        {
          "k": "AR",
          "v": "Delivery"
        }
      ],
      "tags": [
        "Computer Vision",
        "Pose Estimation",
        "Segmentation",
        "AR"
      ],
      "link": "https://github.com/siddhyaaddy/Virtual-Trial-Room",
      "accent": "rose"
    }
  ],
  "skillGroups": [
    {
      "name": "Programming & Analysis",
      "icon": "code",
      "accent": "primary",
      "items": [
        "Python",
        "SQL",
        "R",
        "Pandas",
        "NumPy",
        "scikit-learn"
      ]
    },
    {
      "name": "Machine Learning & Experimentation",
      "icon": "brain",
      "accent": "violet",
      "items": [
        "Model Training & Evaluation",
        "Feature Engineering",
        "Cross-Validation",
        "Hugging Face Transformers",
        "DeBERTa-v3",
        "MLflow"
      ]
    },
    {
      "name": "Cloud & Data Infrastructure",
      "icon": "cloud",
      "accent": "cyan",
      "items": [
        "AWS",
        "ETL Pipeline Design",
        "Data Modeling",
        "Schema Optimization",
        "CI/CD",
        "GitLab",
        "Docker"
      ]
    },
    {
      "name": "Statistics & Visualization",
      "icon": "chart",
      "accent": "amber",
      "items": [
        "Statistical Modeling",
        "Cohort Analysis",
        "A/B Testing",
        "Hypothesis Testing",
        "Tableau",
        "Power BI",
        "Matplotlib"
      ]
    },
    {
      "name": "Big Data & Storage",
      "icon": "database",
      "accent": "rose",
      "items": [
        "Hadoop",
        "PySpark",
        "Databricks",
        "Snowflake",
        "MongoDB",
        "NoSQL"
      ]
    },
    {
      "name": "Tooling & Delivery",
      "icon": "tools",
      "accent": "primary",
      "items": [
        "Git",
        "Jupyter",
        "Streamlit",
        "FastAPI",
        "Excel",
        "MATLAB"
      ]
    }
  ],
  "radar": [
    {
      "axis": "ML / DL",
      "value": 88
    },
    {
      "axis": "NLP & LLMs",
      "value": 92
    },
    {
      "axis": "Data Engineering",
      "value": 85
    },
    {
      "axis": "Statistics",
      "value": 80
    },
    {
      "axis": "Visualization",
      "value": 78
    },
    {
      "axis": "Cloud / MLOps",
      "value": 82
    }
  ],
  "education": [
    {
      "degree": "Master of Science in Data Science",
      "school": "University at Buffalo, State University of New York",
      "period": "Aug 2024 — Dec 2025",
      "location": "Buffalo, NY",
      "detail": "GPA 3.5 / 4.0",
      "badge": "MS",
      "accent": "primary",
      "courses": [
        "Deep Learning",
        "Statistical Learning",
        "Big Data Analytics",
        "Data Intensive Computing",
        "Probability & Statistics"
      ]
    },
    {
      "degree": "Bachelor of Technology in Computer Engineering",
      "school": "Savitribai Phule Pune University — Dr. D.Y. Patil Institute of Engineering, Management and Research",
      "period": "Aug 2020 — May 2024",
      "location": "Pune, MH, India",
      "detail": "Minor in Data Science · GPA 3.7 / 4.0",
      "badge": "BE",
      "accent": "violet",
      "courses": [
        "Data Structures & Algorithms",
        "Database Systems",
        "Operating Systems",
        "Computer Networks",
        "Machine Learning"
      ]
    }
  ],
  "certifications": [
    {
      "name": "IBM Data Science Professional Certificate",
      "issuer": "IBM",
      "year": "Ongoing",
      "icon": "brain",
      "accent": "primary"
    },
    {
      "name": "Data Analytics Professional Certificate",
      "issuer": "Google",
      "year": "2023",
      "icon": "chart",
      "accent": "amber"
    },
    {
      "name": "Real-Time Inference & Streaming Concepts",
      "issuer": "Self-directed",
      "year": "2025",
      "icon": "bolt",
      "accent": "cyan"
    },
    {
      "name": "Mathematical Optimization Models",
      "issuer": "Coursework",
      "year": "2024",
      "icon": "sigma",
      "accent": "violet"
    }
  ],
  "images": {
    "hero": "./assets/img/pic1.png",
    "about": "./assets/img/photo2.jpg"
  }
};

/* Derived — the chatbot's retrieval corpus is built from PROFILE so it can never drift. */
function buildKnowledgeBase(p) {
  const docs = [];
  const add = (id, topic, text, tags) =>
    docs.push({ id, topic, text, tags: tags.map((t) => t.toLowerCase()) });

  add("identity", "About Siddharth",
    `${p.fullName} is a ${p.role} based in ${p.location}. ${p.summary} ${p.tagline}`,
    ["who", "about", "intro", "yourself", "bio", "summary", "siddharth"]);

  add("contact", "Contact",
    `You can reach Siddharth by email at ${p.email} or by phone at ${p.phone}. He is on LinkedIn (${p.links.linkedin}), GitHub (${p.links.github}) and Kaggle (${p.links.kaggle}). Status: ${p.availability}.`,
    ["contact", "email", "phone", "reach", "hire", "linkedin", "github", "kaggle", "available", "availability"]);

  p.experience.forEach((e, i) => {
    add(`exp-${i}`, `${e.role} @ ${e.company}`,
      `At ${e.company} (${e.role}, ${e.period}, ${e.location}): ${e.blurb} ` +
        e.points.map((x) => x.replace(/<[^>]+>/g, "")).join(" "),
      ["experience", "work", "job", "role", "intern", "internship", e.company, ...e.tags]);
  });

  p.projects.forEach((pr, i) => {
    add(`proj-${i}`, pr.title,
      `Project "${pr.title}" (${pr.period}, ${pr.category}): ${pr.summary} ` +
        pr.points.map((x) => x.replace(/<[^>]+>/g, "")).join(" ") +
        ` Repository: ${pr.link}`,
      ["project", "projects", "built", "portfolio", pr.category, pr.title, ...pr.tags]);
  });

  p.skillGroups.forEach((s, i) => {
    add(`skill-${i}`, s.name,
      `${s.name}: ${s.items.join(", ")}.`,
      ["skill", "skills", "stack", "tech", "technology", "tools", "know", s.name, ...s.items]);
  });

  p.education.forEach((ed, i) => {
    add(`edu-${i}`, ed.degree,
      `${ed.degree} at ${ed.school} (${ed.period}, ${ed.location}). ${ed.detail}. Relevant coursework: ${ed.courses.join(", ")}.`,
      ["education", "degree", "university", "college", "school", "study", "gpa", "masters", "bachelors", ed.school]);
  });

  add("certs", "Certifications",
    p.certifications.map((c) => `${c.name} (${c.issuer}, ${c.year})`).join("; ") + ".",
    ["certification", "certifications", "certificate", "credential", "course"]);

  add("strengths", "Why hire Siddharth",
    "Siddharth combines production data engineering with modern LLM work: he ships ETL and CI/CD that hold up in production, fine-tunes transformers with disciplined experiment tracking, and communicates results directly to executives. He has taken RAG systems from prototype to indexed, automated pipelines over 500K+ documents, and has repeatedly delivered measurable cuts in processing time and manual effort.",
    ["why", "hire", "strength", "strengths", "good", "best", "fit", "value", "differentiator"]);

  return docs;
}

const KNOWLEDGE = buildKnowledgeBase(PROFILE);
