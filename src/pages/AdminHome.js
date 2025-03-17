import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { db } from "../firebase"; // Import Firebase Firestore
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

const Client = () => {
    const [cases, setCases] = useState([]);
    const [newCase, setNewCase] = useState({
        name: "",
        type: "",
        picUrl: "",
        img1: "",
        img2: "",
        img3: "",
        description: "",
        description1: "",
        description2: "",
        customType: "",
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCaseId, setCurrentCaseId] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);

    // Fetch cases from Firestore
    useEffect(() => {
        const fetchCases = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "cases"));
                const casesData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCases(casesData);
            } catch (error) {
                toast.error("Error fetching cases: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewCase((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const caseType = newCase.type === "Other" ? newCase.customType : newCase.type;

        if (!newCase.name || !caseType || !newCase.description) {
            toast.error("Name, type, and description are required.");
            return;
        }

        try {
            const caseData = {
                name: newCase.name,
                type: caseType,
                picUrl: newCase.picUrl,
                img1: newCase.img1,
                img2: newCase.img2,
                img3: newCase.img3,
                description: newCase.description,
                description1: newCase.description1,
                description2: newCase.description2,
            };

            if (isEditing) {
                // Update existing case in Firestore
                const caseRef = doc(db, "cases", currentCaseId);
                await updateDoc(caseRef, caseData);
                toast.success("Case updated successfully!");
            } else {
                // Add new case to Firestore
                await addDoc(collection(db, "cases"), caseData);
                toast.success("Case added successfully!");
            }

            // Reset form and state
            setNewCase({
                name: "",
                type: "",
                picUrl: "",
                img1: "",
                img2: "",
                img3: "",
                description: "",
                description1: "",
                description2: "",
                customType: "",
            });
            setShowForm(false);
            setIsEditing(false);
            setCurrentCaseId(null);

            // Refresh the cases list
            const querySnapshot = await getDocs(collection(db, "cases"));
            const casesData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCases(casesData);
        } catch (error) {
            console.error("Error saving case:", error);
            toast.error("Failed to save case: " + error.message);
        }
    };

    // Handle case deletion
    const handleDelete = async (id) => {
        if (!id) {
            toast.error("Invalid case ID.");
            return;
        }

        try {
            await deleteDoc(doc(db, "cases", id));
            setCases((prevCases) => prevCases.filter((item) => item.id !== id));
            toast.success("Case deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete case: " + error.message);
        }
    };

    // Handle case editing
    const handleEdit = (caseData) => {
        setNewCase({
            name: caseData.name,
            type: caseData.type,
            picUrl: caseData.picUrl,
            img1: caseData.img1,
            img2: caseData.img2,
            img3: caseData.img3,
            description: caseData.description,
            description1: caseData.description1,
            description2: caseData.description2,
            customType: caseData.type === "Other" ? caseData.customType : "",
        });
        setIsEditing(true);
        setCurrentCaseId(caseData.id);
        setShowForm(true);
    };

    // Handle case selection for details view
    const handleCaseClick = (caseData) => {
        setSelectedCase(caseData);
    };

    // Return to list view
    const handleBackToList = () => {
        setSelectedCase(null);
    };

    return (
        <div>
            <Header />
            <Navbar />
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />

            <section className="text-gray-700 body-font">
                <h1 className="font-bold text-xl md:text-xl lg:text-3xl text-center mt-8 md:mt-10">
                    Manage Cases
                </h1>

                {selectedCase ? (
                    <div className="container px-5 py-8 mx-auto">
                        <button
                            onClick={handleBackToList}
                            className="mb-4 text-blue-500 hover:text-blue-700"
                        >
                            &larr; Back to List
                        </button>
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-2xl font-bold mb-2">{selectedCase.name}</h2>
                            <h3 className="text-gray-500 text-sm mb-4">{selectedCase.type}</h3>
                            <img
                                alt={selectedCase.name}
                                className="w-full h-64 object-cover object-center rounded-lg mb-4"
                                src={selectedCase.picUrl}
                            />
                            <p className="mb-4">{selectedCase.description}</p>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {selectedCase.img1 && (
                                    <img
                                        alt="Image 1"
                                        className="w-full h-32 object-cover object-center rounded-lg"
                                        src={selectedCase.img1}
                                    />
                                )}
                                {selectedCase.img2 && (
                                    <img
                                        alt="Image 2"
                                        className="w-full h-32 object-cover object-center rounded-lg"
                                        src={selectedCase.img2}
                                    />
                                )}
                                {selectedCase.img3 && (
                                    <img
                                        alt="Image 3"
                                        className="w-full h-32 object-cover object-center rounded-lg"
                                        src={selectedCase.img3}
                                    />
                                )}
                            </div>
                            <p className="mb-4">{selectedCase.description1}</p>
                            <p className="mb-4">{selectedCase.description2}</p>
                        </div>
                    </div>
                ) : (
                    <div className="container px-5 py-8 mx-auto">
                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : (
                            <div className="flex flex-wrap -m-4">
                                {cases.map((item) => (
                                    <div
                                        key={item.id}
                                        className="lg:w-1/4 md:w-1/3 sm:w-1/2 p-4 w-full pro cursor-pointer"
                                        onClick={() => handleCaseClick(item)}
                                    >
                                        <a className="block relative h-48 rounded overflow-hidden">
                                            <img
                                                alt={item.name}
                                                className="object-cover object-center w-full h-full block"
                                                src={item.picUrl}
                                            />
                                        </a>
                                        <div className="mt-4">
                                            <h3 className="text-gray-500 text-xs tracking-widest title-font mb-1">
                                                {item.type}
                                            </h3>
                                            <h2 className="text-gray-900 title-font text-lg font-medium">
                                                {item.name}
                                            </h2>
                                            <p className="mt-1">{item.description}</p>
                                            <button
                                                className="mt-2 text-blue-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(item);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="mt-2 text-red-500 ml-4"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {showForm && (
                <section className="bg-gray-100 py-8 px-5">
                    <h2 className="text-2xl font-bold text-center mb-6">
                        {isEditing ? "Edit Case" : "Add a New Case"}
                    </h2>
                    <form
                        onSubmit={handleSubmit}
                        className="sm:w-[70%] max-w-md mx-auto space-y-4 bg-gray-100 p-6 rounded-lg shadow-xl"
                    >
                        <input
                            type="text"
                            name="name"
                            value={newCase.name}
                            onChange={handleChange}
                            placeholder="Enter case name"
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <select
                            name="type"
                            value={newCase.type}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">Select case type</option>
                            <option value="Stolen Phone">Stolen Phone</option>
                            <option value="Stolen Bike">Stolen Bike</option>
                            <option value="Stolen Laptop">Stolen Laptop</option>
                            <option value="Stolen Car">Stolen Car</option>
                            <option value="Rape">Rape</option>
                            <option value="Divorce">Divorce</option>
                            <option value="Fraud">Fraud</option>
                            <option value="Murder">Murder</option>
                            <option value="Cybercrime">Cybercrime</option>
                            <option value="Drug Trafficking">Drug Trafficking</option>
                            <option value="Other">Other</option>
                        </select>

                        {newCase.type === "Other" && (
                            <input
                                type="text"
                                name="customType"
                                value={newCase.customType || ""}
                                onChange={handleChange}
                                placeholder="Specify case type"
                                required
                                className="w-full px-3 py-2 border rounded-lg mt-2"
                            />
                        )}
                        <input
                            type="text"
                            name="picUrl"
                            value={newCase.picUrl}
                            onChange={handleChange}
                            placeholder="Enter main image URL"
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <input
                            type="text"
                            name="img1"
                            value={newCase.img1}
                            onChange={handleChange}
                            placeholder="Enter image 1 URL"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <input
                            type="text"
                            name="img2"
                            value={newCase.img2}
                            onChange={handleChange}
                            placeholder="Enter image 2 URL"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <input
                            type="text"
                            name="img3"
                            value={newCase.img3}
                            onChange={handleChange}
                            placeholder="Enter image 3 URL"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <textarea
                            name="description"
                            value={newCase.description}
                            onChange={handleChange}
                            placeholder="Enter main description"
                            rows="4"
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                        ></textarea>
                        <textarea
                            name="description1"
                            value={newCase.description1}
                            onChange={handleChange}
                            placeholder="Enter description 1"
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg"
                        ></textarea>
                        <textarea
                            name="description2"
                            value={newCase.description2}
                            onChange={handleChange}
                            placeholder="Enter description 2"
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg"
                        ></textarea>

                        <button
                            type="submit"
                            className="w-full px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            {isEditing ? "Update Case" : "Add Case"}
                        </button>
                    </form>
                </section>
            )}

            <button
                onClick={() => {
                    setShowForm(!showForm);
                    setIsEditing(false);
                    setNewCase({
                        name: "",
                        type: "",
                        picUrl: "",
                        img1: "",
                        img2: "",
                        img3: "",
                        description: "",
                        description1: "",
                        description2: "",
                        customType: "",
                    });
                }}
                className="fixed bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white text-3xl w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
            >
                {showForm ? "-" : "+"}
            </button>

            <Footer />
        </div>
    );
};

export default Client;