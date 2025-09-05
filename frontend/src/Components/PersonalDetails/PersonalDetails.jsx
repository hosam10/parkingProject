// PersonalDetails.js (מתוקן, סופי)
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Modal from "react-modal";
import "./PersonalDetails.css";
import HeaderHome from "../HeaderHome/HeaderHome";
import personalDetails from "../images/personalDetails.gif";

Modal.setAppElement("#root");

const API = "http://127.0.0.1:5000";
const MIN_YEAR = 1990;
const MAX_YEAR = 2025;

// ------ עזר לפורמט לוחית ------
const normalizeCarNumber = (s) => (s || "").replace(/\D/g, "").slice(0, 8);
const formatCarNumberInput = (val) => {
  const d = normalizeCarNumber(val);
  if (d.length >= 8) return d.replace(/(\d{3})(\d{2})(\d{0,3}).*/, "$1-$2-$3"); // 123-45-678
  if (d.length >= 7) return d.replace(/(\d{2})(\d{3})(\d{0,2}).*/, "$1-$2-$3"); // 12-456-67
  if (d.length >= 6) return d.replace(/(\d{2})(\d{2})(\d{0,2}).*/, "$1-$2-$3"); // 12-34-56
  return d;
};

export default function PersonalDetails() {
  // --- משתמש מלוקאל ---
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [userDetails, setUserDetails] = useState(null);
  const [ownerId, setOwnerId] = useState(storedUser?.id || null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);


  // --- רכבים ---
  const [cars, setCars] = useState([]);
  const [carNumberNew, setCarNumberNew] = useState("");
  const [carTypeNew, setCarTypeNew] = useState("");
  const [carYearNew, setCarYearNew] = useState("");
  const [carsError, setCarsError] = useState("");
  const [addingCar, setAddingCar] = useState(false);
  const [deletingCar, setDeletingCar] = useState(null);

  // --- Form validation states ---
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const CAR_BRANDS = [
    "Toyota",
    "Volkswagen",
    "Hyundai",
    "Kia",
    "Honda",
    "Nissan",
    "Ford",
    "Chevrolet",
    "Tesla",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Lexus",
    "Porsche",
    "Mazda",
    "Subaru",
    "Mitsubishi",
    "Suzuki",
    "Volvo",
    "Skoda",
    "Seat",
    "Cupra",
    "Renault",
    "Peugeot",
    "Citroën",
    "Dacia",
    "Opel",
    "Fiat",
    "Alfa Romeo",
    "Jeep",
    "Dodge",
    "RAM",
    "GMC",
    "Cadillac",
    "Mini",
    "Land Rover",
    "Jaguar",
    "Infiniti",
    "Acura",
    "BYD",
    "Geely",
    "MG",
    "Chery",
    "Haval",
    "Great Wall",
    "SAIC Maxus",
    "Tata",
    "Mahindra",
  ];

  // ----- Form validation functions -----
  const validateForm = (formData) => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.address?.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters";
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    return errors;
  };

  const validateCarForm = (carData) => {
    const errors = {};
    
    const num = normalizeCarNumber(carData.carNumber);
    if (!num || num.length < 6 || num.length > 8) {
      errors.carNumber = "Car number must be 6-8 digits";
    }
    
    if (!carData.carType?.trim()) {
      errors.carType = "Car type is required";
    }
    
    const year = parseInt(carData.carYear || "0", 10);
    if (!year || year < MIN_YEAR || year > MAX_YEAR) {
      errors.carYear = `Year must be between ${MIN_YEAR}-${MAX_YEAR}`;
    }
    
    return errors;
  };

  // ----- טעינת פרטי המשתמש -----
  const localCarNumber = storedUser?.car_number;
  useEffect(() => {
    const loadUserDetails = async () => {
      if (!localCarNumber && !storedUser?.email) {
        setErrorMessage("User is not logged in or identifiers are missing.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setErrorMessage("");
        const res = await axios.get(`${API}/get_user_details`, {
          params: {
            car_number: localCarNumber || undefined,
            email: storedUser?.email || undefined,
          },
        });
        const u = res.data.user || {};
        setUserDetails(u);
        if (!ownerId && u?.id) setOwnerId(u.id);
      } catch (err) {
        setErrorMessage("Failed to load user details. Please try again.");
        console.error("Error loading user details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCarNumber]);

  // ----- טעינת רכבי המשתמש -----
  const loadCars = async (uid) => {
    if (!uid) return;
    try {
      const { data } = await axios.get(`${API}/users/${uid}/cars`);
      setCars(data.cars || []);
    } catch {
      setCarsError("");
      // setCarsError("Failed to load cars");
    }
  };
  useEffect(() => {
    if (ownerId) loadCars(ownerId);
  }, [ownerId]);

const handleSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const formData = {
    name: form.name.value.trim(),
    address: form.address.value.trim(),
    phone: storedUser?.phone || "",
    password: form.password.value.trim(),
  };

  // Validate form
  const errors = validateForm(formData);
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  try {
    setUpdating(true);
    setFormErrors({});
    setSuccessMessage("");
    
    const response = await axios.put(`${API}/update_user_details`, formData);
    
    setSuccessMessage("Details updated successfully!");
    localStorage.setItem("user", JSON.stringify(response.data.user));
    window.dispatchEvent(new Event("storage"));
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  } catch (err) {
    setErrorMessage(err.response?.data?.message || "Error updating user details");
  } finally {
    setUpdating(false);
  }
};




  // ----- הוספת רכב -----
  const addCar = async (e) => {
    e.preventDefault();
    setCarsError("");
    
    if (!ownerId) {
      setCarsError("Missing user id.");
      return;
    }

    const carData = {
      carNumber: carNumberNew,
      carType: carTypeNew,
      carYear: carYearNew,
    };

    // Validate car form
    const errors = validateCarForm(carData);
    if (Object.keys(errors).length > 0) {
      setCarsError(Object.values(errors)[0]); // Show first error
      return;
    }

    try {
      setAddingCar(true);
      const num = normalizeCarNumber(carNumberNew);
      const yr = parseInt(carYearNew, 10);
      
      const { data } = await axios.post(`${API}/users/${ownerId}/cars`, {
        car_number: num,
        car_type: carTypeNew.trim(),
        car_year: yr,
      });
      
      setCars(data.cars || []);
      setCarNumberNew("");
      setCarTypeNew("");
      setCarYearNew("");
      setSuccessMessage("Car added successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setCarsError(err.response?.data?.message || "Failed to add car.");
    } finally {
      setAddingCar(false);
    }
  };

  // ----- מחיקת רכב -----
  const deleteCar = async (carId) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete car ${car.car_number} (${car.car_type} ${car.car_year})?`
    );
    
    if (!confirmed) return;

    setCarsError("");
    try {
      setDeletingCar(carId);
      await axios.delete(`${API}/users/${ownerId}/cars/${carId}`);
      setCars((prev) => prev.filter((c) => c.id !== carId));
      setSuccessMessage("Car deleted successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setCarsError(err.response?.data?.message || "Failed to delete car.");
    } finally {
      setDeletingCar(null);
    }
  };

  if (loading) {
    return (
      <div>
        <HeaderHome />
        <div className="personal-details-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeaderHome />
      <div className="personal-details-container">
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {errorMessage}
          </div>
        )}

        {/* טופס פרטים כלליים + אימות מייל */}
        <form onSubmit={handleSubmit} className="personal-details-form">
          <h2>
            Personal Details <img src={personalDetails} alt="personalDetails" />
          </h2>

          <div className="personal-details-sections">
            <div className="personal-details-left">
              <div className="input-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  defaultValue={userDetails?.name || ""}
                  className={formErrors.name ? "error" : ""}
                  required
                />
                {formErrors.name && (
                  <span className="field-error">{formErrors.name}</span>
                )}
              </div>
              <div className="input-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  defaultValue={userDetails?.address || ""}
                  className={formErrors.address ? "error" : ""}
                  required
                />
                {formErrors.address && (
                  <span className="field-error">{formErrors.address}</span>
                )}
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={userDetails?.email || ""}
                  disabled
                />
                <small className="field-hint">Email cannot be changed</small>
              </div>
            </div>

            <div className="personal-details-right">
              {/* <div className="input-group">
                <label htmlFor="car_year">Year</label>
                <input
                  id="car_year"
                  name="car_year"
                  type="number"
                  defaultValue={userDetails?.car_year || ""}
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  required
                />
              </div> */}
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={userDetails?.password || ""}
                  className={formErrors.password ? "error" : ""}
                  placeholder="Leave empty to keep current password"
                />
                {formErrors.password && (
                  <span className="field-error">{formErrors.password}</span>
                )}
                <small className="field-hint">Leave empty to keep current password</small>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <span className="button-spinner"></span>
                    Updating...
                  </>
                ) : (
                  "Update Details"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ניהול רכבים */}
        <div className="cars-manager">
          <h3>My Cars</h3>

          {carsError && (
            <div className="error-message" style={{ marginBottom: 10 }}>
              {carsError}
            </div>
          )}

          <form onSubmit={addCar} className="car-add-form">
            <div className="input-group">
              <label>Car Number</label>
              <input
                value={carNumberNew}
                onChange={(e) =>
                  setCarNumberNew(formatCarNumberInput(e.target.value))
                }
                placeholder="123-45-678"
                inputMode="numeric"
                required
              />
            </div>
            <div className="input-group">
              <label className="label">Car Type</label>
              <input
                className="input type"
                type="text"
                list="car-brands"
                value={carTypeNew}
                onChange={(e) => setCarTypeNew(e.target.value)}
                placeholder="Audi"
                required
              />
              <datalist id="car-brands">
                {CAR_BRANDS.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>

            <div className="input-group">
              <label>Year</label>
              <input
                type="number"
                value={carYearNew}
                onChange={(e) =>
                  setCarYearNew(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder={`${MIN_YEAR}-${MAX_YEAR}`}
                min={MIN_YEAR}
                max={MAX_YEAR}
                required
              />
            </div>
            <button type="submit" className="submit-button" disabled={addingCar}>
              {addingCar ? (
                <>
                  <span className="button-spinner"></span>
                  Adding...
                </>
              ) : (
                "Add Car"
              )}
            </button>
          </form>

          {cars.length === 0 ? (
            <p style={{ marginTop: 8 }}>No cars yet.</p>
          ) : (
            <ul className="cars-list">
              {cars.map((c) => (
                <li key={c.id} className="car-item">
                  <div className="car-item-left">
                    <div>
                      <b>Number:</b> {c.car_number}
                    </div>
                    <div>
                      <b>Type:</b> {c.car_type}
                    </div>
                    <div>
                      <b>Year:</b> {c.car_year}
                    </div>
                  </div>
                  <button 
                    className="danger" 
                    onClick={() => deleteCar(c.id)}
                    disabled={deletingCar === c.id}
                  >
                    {deletingCar === c.id ? (
                      <>
                        <span className="button-spinner"></span>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
