import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { generateInvestigationSteps } from "./api";

// ... (keep the DEFAULT_INVESTIGATION_STEPS array exactly as before)
const DEFAULT_INVESTIGATION_STEPS = [
  {
    phase: "Phase 1: Case Initiation & Planning",
    steps: [
      "Receive Case Assignment – Obtain case details from the client, law enforcement, or agency.",
      "Understand the Case Type – Determine whether it's a criminal, civil, corporate, or private investigation.",
      "Review Initial Reports – Analyze any police reports, witness statements, or preliminary evidence.",
      "Set Investigation Goals – Define the objectives (e.g., prove/disprove a claim, find a missing person, collect forensic evidence).",
      "Plan Investigation Strategy – Outline steps, allocate resources, and define priorities.",
      "Gather Background Information – Research the people, locations, and context of the case.",
      "Identify Key Stakeholders – Determine who is involved (victims, suspects, witnesses, law enforcement).",
      "Establish Jurisdiction & Legal Boundaries – Ensure legal procedures are followed to avoid invalid evidence.",
    ],
  },
  {
    phase: "Phase 2: Evidence Collection & Crime Scene Processing",
    steps: [
      "Secure the Crime Scene – Prevent contamination and unauthorized access.",
      "Document the Scene – Take photographs, videos, and notes.",
      "Collect Physical Evidence – Secure fingerprints, DNA, weapons, documents, etc.",
      "Examine Digital Evidence – Extract data from computers, phones, and surveillance cameras.",
      "Interview First Responders – Gather insights from police officers, paramedics, or eyewitnesses.",
      "Sketch or Reconstruct the Scene – Create diagrams or 3D reconstructions of events.",
      "Determine Timeframe of Events – Establish a timeline based on evidence and testimonies.",
      "Check for Witnesses Nearby – Look for surveillance footage or bystanders who may have seen something.",
    ],
  },
  {
    phase: "Phase 3: Interviews & Intelligence Gathering",
    steps: [
      "Interview Victims & Witnesses – Obtain firsthand accounts of the incident.",
      "Analyze Witness Credibility – Cross-check statements for inconsistencies or bias.",
      "Develop Suspect Profiles – Use behavioral analysis to identify potential perpetrators.",
      "Conduct Background Checks – Investigate criminal history, financial records, and affiliations.",
      "Follow Financial Trails – Examine bank statements, transactions, and assets if fraud is suspected.",
      "Surveillance & Tracking – Monitor suspect movements using legal tracking methods.",
      "Gather Informant Tips – Use confidential sources to obtain inside information.",
      "Analyze Communication Records – Check call logs, messages, emails, and social media activity.",
      "Conduct Polygraph Tests (if applicable) – Assess suspect honesty using lie detection methods.",
    ],
  },
  {
    phase: "Phase 4: Analysis & Case Building",
    steps: [
      "Compare Evidence & Witness Testimonies – Look for consistencies and contradictions.",
      "Use Forensic Analysis – Apply ballistics, DNA, handwriting analysis, and toxicology if necessary.",
      "Establish Motive, Means, and Opportunity – Determine why, how, and when the crime occurred.",
      "Map Out Connections Between Individuals – Use link analysis to identify relationships.",
      "Reconstruct the Crime – Use available evidence to create a possible sequence of events.",
    ],
  },
  {
    phase: "Phase 5: Closing the Case & Reporting",
    steps: [
      "Draw Conclusions & Identify the Culprit – Based on solid evidence and logical deductions.",
      "Prepare an Official Report – Document all findings in a structured manner.",
      "Present Evidence to Authorities – Work with prosecutors, lawyers, or relevant agencies.",
      "Ensure Proper Chain of Custody – Maintain records to preserve evidence integrity.",
      "Testify in Court (if required) – Provide expert analysis and sworn statements.",
      "Close the Case or Continue Investigation – If sufficient evidence is found, proceed with legal action; if not, continue gathering information.",
      "Review Investigation for Errors or Missed Leads – Double-check the case before finalizing.",
      "Store Evidence & Secure Records – Ensure proper archiving for future reference.",
      "Provide Support to Victims & Witnesses – Offer guidance on legal steps and protection if needed.",
      "Reflect & Improve Investigation Techniques – Analyze the case for lessons learned and areas of improvement.",
    ],
  },
];

export const getInvestigationSteps = async (caseId, incidentType) => {
  try {
    // First try to get generated steps from Firestore
    const investigationDoc = await getDoc(doc(db, "investigations", incidentType));
    
    if (investigationDoc.exists()) {
      return {
        steps: investigationDoc.data().steps,
        source: investigationDoc.data().isDefault ? "default" : "generated"
      };
    }

    // If not found, try to generate new steps using Gemini API
    try {
      const generatedSteps = await generateInvestigationSteps(incidentType);
      
      if (generatedSteps && generatedSteps.length > 0) {
        // Save the generated steps for future use
        await setDoc(doc(db, "investigations", incidentType), {
          steps: generatedSteps,
          createdAt: new Date(),
          isDefault: false,
          lastGenerated: new Date()
        });
        return {
          steps: generatedSteps,
          source: "generated"
        };
      }
    } catch (error) {
      console.error("Failed to generate steps, using defaults. Error:", error.message);
      // Save error information for debugging
      await setDoc(doc(db, "generationErrors", `${incidentType}_${Date.now()}`), {
        incidentType,
        error: error.message,
        timestamp: new Date()
      });
    }

    // Fall back to default steps if generation fails
    await setDoc(doc(db, "investigations", incidentType), {
      steps: DEFAULT_INVESTIGATION_STEPS,
      isDefault: true,
      createdAt: new Date(),
      usedDefault: true
    });
    
    return {
      steps: DEFAULT_INVESTIGATION_STEPS,
      source: "default"
    };
  } catch (error) {
    console.error("Error getting investigation steps:", error);
    return {
      steps: DEFAULT_INVESTIGATION_STEPS,
      source: "default",
      error: error.message
    };
  }
};

export const generateNewSteps = async (incidentType) => {
  try {
    const generatedSteps = await generateInvestigationSteps(incidentType);
    
    if (generatedSteps && generatedSteps.length > 0) {
      await setDoc(doc(db, "investigations", incidentType), {
        steps: generatedSteps,
        createdAt: new Date(),
        isDefault: false,
        lastGenerated: new Date()
      });
      return {
        steps: generatedSteps,
        source: "generated"
      };
    }
    throw new Error("Failed to generate steps: empty response");
  } catch (error) {
    console.error("Error generating new steps:", error);
    // Save error information for debugging
    await setDoc(doc(db, "generationErrors", `${incidentType}_${Date.now()}`), {
      incidentType,
      error: error.message,
      timestamp: new Date(),
      action: "manual-regeneration"
    });
    throw error;
  }
};

// ... (keep saveInvestigationProgress function exactly as before)

export const saveInvestigationProgress = async (caseId, data) => {
  try {
    await setDoc(doc(db, "investigations", caseId), {
      firId: caseId,
      data: data,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error saving investigation progress:", error);
    throw error;
  }
};