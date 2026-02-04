import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Card,
  Row,
  Col,
  Alert,
  FloatingLabel,
} from "react-bootstrap";
import { FaRegTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";

const RequestDepedAccount = () => {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedRequestType, setSubmittedRequestType] = useState("");
  const [schools, setSchools] = useState([]); // Store schools from the database
  const [designations, setDesignations] = useState([]); // Store designations from the database
  const [formData, setFormData] = useState({
    requestType: "new",
    selectedType: "",
    surname: "",
    firstName: "",
    middleName: "",
    designation: "",
    school: "",
    schoolID: "",
    personalGmail: "",
    employeeNumber: "",
    personalEmail: '',
    deped_email: '', // Changed to match backend
    proofOfIdentity: null,
    prcID: null,
    endorsementLetter: null,
    isDepedRA: false,
    attachmentPreviews: [],
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch schools from the database on component mount
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/depedacc/schoolList`);
        
        // First check if response is OK (status 200-299)
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
    
        // Check content type before parsing as JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
    
        const data = await response.json();
        setSchools(data);
        setError("");
      } catch (err) {
        console.error("Error fetching schools:", err);
        setError("Error fetching schools. Please check your network and server.");
        setSchools([]); // Fallback to empty array
      }
    };
    
    const fetchDesignations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/depedacc/designations`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
    
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
    
        const data = await response.json();
        setDesignations(data);
        setError("");
      } catch (err) {
        console.error("Error fetching designations:", err);
        setError("Error fetching designations. Please check your network and server.");
        setDesignations([]); // Fallback to empty array
      }
    };

    fetchSchools();
    fetchDesignations();
  }, []);

  const handleRequestTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      requestType: e.target.value,
      // Reset selectedType when changing request type
      selectedType: "",
      school: "",
      schoolID: "",
    }));
    setError("");
  };

  const handleTypeChange = (e) => {
    setFormData((prev) => ({ ...prev, selectedType: e.target.value }));
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Live validation for Personal Gmail field
    if (name === "personalGmail") {
      const lower = value.toLowerCase();

      if (lower.endsWith("@deped.gov.ph")) {
        setError(
          "Personal Gmail must not be a DepEd email address (@deped.gov.ph)."
        );
      } else if (error && error.includes("Personal Gmail")) {
        // Clear this specific error once the address is no longer a DepEd email
        setError("");
      }
    }
  };

  const handleSchoolChange = (e) => {
    const selectedSchoolName = e.target.value;
    const selectedSchool = schools.find(
      (school) => school.school === selectedSchoolName
    );

    if (selectedSchool) {
      setFormData((prev) => ({
        ...prev,
        school: selectedSchool.school,
        schoolID: selectedSchool.schoolCode,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        school: "",
        schoolID: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    if (file.size > maxSize) {
      setError("File size exceeds 5MB limit");
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [name]: file,
          attachmentPreviews: [
            ...prev.attachmentPreviews,
            { name: file.name, url: reader.result, type: name },
          ],
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: file,
        attachmentPreviews: [
          ...prev.attachmentPreviews,
          { name: file.name, type: name },
        ],
      }));
    }
  };

  const handleRemoveAttachment = (type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: null,
      attachmentPreviews: prev.attachmentPreviews.filter(
        (file) => file.type !== type
      ),
    }));
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/"); // Redirect to login page
  };

  // Add this email validation function
  const isValidGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const {
      requestType,
      selectedType,
      surname,
      firstName,
      middleName,
      school,
      schoolID,
      employeeNumber,
      designation,
      personalGmail,
      personalEmail,
      deped_email, // Changed to match backend
      proofOfIdentity,
      prcID,
      endorsementLetter,
      isDepedRA,
    } = formData;

    if (!isDepedRA) {
      setError("You must agree and give your consent before submitting the form.");
      setIsSubmitting(false);
      return;
    }

    if (
      !requestType ||
      !selectedType ||
      !surname ||
      !firstName ||
      !school ||
      !schoolID
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }
  
    let endpoint = "";
    let options = {
      method: "POST",
    };

    let body = null;

    if (requestType === "new") {
      endpoint = `${API_BASE_URL}/api/depedacc/request-deped-account`;
      body = new FormData();

      body.append("selectedType", selectedType);
      body.append("surname", surname);
      body.append("firstName", firstName);
      body.append("middleName", middleName);
      body.append("designation", designation);
      body.append("school", school);
      body.append("schoolID", schoolID);
      body.append("personalGmail", personalGmail);
      body.append("proofOfIdentity", proofOfIdentity);
      body.append("prcID", prcID);
      body.append("endorsementLetter", endorsementLetter);

      options.body = body;

      // Disallow DepEd email in the personal Gmail field
      if (
        personalGmail &&
        personalGmail.toLowerCase().endsWith("@deped.gov.ph")
      ) {
        setError(
          "Personal Gmail must not be a DepEd email address (@deped.gov.ph)."
        );
        setIsSubmitting(false);
        return;
      }

      // Existing Gmail validation
      if (!isValidGmail(personalGmail)) {
        setError(
          "Please provide a valid Gmail address (must end with @gmail.com)"
        );
        setIsSubmitting(false);
        return;
      }
    } else if (requestType === "reset") {
      // Validate DepEd email format
      if (!deped_email.endsWith("@deped.gov.ph")) {
        setError("DepEd email must end with @deped.gov.ph");
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!employeeNumber || !personalEmail || !deped_email) {
        setError("Please provide employee number and both email addresses");
        setIsSubmitting(false);
        return;
      }

      endpoint = `${API_BASE_URL}/api/depedacc/reset-deped-account`;
      body = JSON.stringify({
        selectedType: selectedType,
        surname: surname,
        firstName: firstName,
        middleName: middleName || "",
        school: school,
        schoolID: schoolID,
        employeeNumber: employeeNumber,
        personalEmail: personalEmail,
        deped_email: deped_email, // Changed to match backend
      });
      options.headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      options.body = body;
    }

    try {
      const response = await fetch(endpoint, options);
  
      if (response.ok) {
        const responseData = await response.json();
        const requestNumber = responseData.requestNumber || responseData.resetNumber;
  
        Swal.fire({
          title: "Success!",
          html: `${requestType === "new" ? "New Account" : "Reset Account"} request has been submitted successfully!<br><br>Request Number: <b>${requestNumber}</b><br><br>Please screenshot to check your status`,
          icon: "success",
          confirmButtonText: "Done",
          willClose: () => {
            navigate("/");
          },
        });
  
        // Reset form with personalEmail included
        // In the success handler where you reset the form
        setFormData({
          requestType: "",
          selectedType: "",
          surname: "",
          firstName: "",
          middleName: "",
          designation: "",
          school: "",
          schoolID: "",
          personalGmail: "",
          personalEmail: "",
          deped_email: "", // Changed to match backend
          employeeNumber: "",
          proofOfIdentity: null,
          prcID: null,
          endorsementLetter: null,
          attachmentPreviews: [],
        });
      } else {
        const errorText = await response.text();
        console.error("Server responded with an error:", errorText);
        setError(`Failed to submit request: ${response.status} - ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setError(`Error submitting request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile view (no container) */}
      <div className="d-block d-md-none mt-4 px-2">
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <div className="mb-4">
            <h3>DepEd Account Request</h3>
          </div>

          {/* Conditional form fields based on request type */}
          {formData.requestType && (
            <Form.Group as={Row} className="mb-3">
              <Form.Label column xs={12}>
                Account Type
              </Form.Label>
              <Col xs={12}>
                <Form.Select
                  value={formData.selectedType}
                  name="selectedType"
                  onChange={handleTypeChange}
                  required
                >
                  <option value="">-- Select Account Type --</option>
                  <option value="gmail">DepEd Gmail Account</option>
                  <option value="office365">Office 365 Account</option>
                </Form.Select>
              </Col>
            </Form.Group>
          )}

          {/* Common fields for both request types */}
          {formData.selectedType && (
            <>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column xs={12}>
                  Name
                </Form.Label>
                <Col xs={12}>
                  <Row>
                    <Col xs={12} className="mb-2">
                      <FloatingLabel label="Surname">
                        <Form.Control
                          type="text"
                          name="surname"
                          value={formData.surname || ""}
                          onChange={handleChange}
                          placeholder="Surname"
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col xs={12} className="mb-2">
                      <FloatingLabel label="First Name">
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName || ""}
                          onChange={handleChange}
                          placeholder="First Name"
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col xs={12}>
                      <FloatingLabel label="Middle Name">
                        <Form.Control
                          type="text"
                          name="middleName"
                          value={formData.middleName || ""}
                          onChange={handleChange}
                          placeholder="Middle Name"
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column xs={12}>
                  School
                </Form.Label>
                <Col xs={12}>
                  <Form.Select
                    name="school"
                    value={formData.school}
                    onChange={handleSchoolChange}
                    required
                  >
                    <option value="">-- Select School --</option>
                    {schools.map((school) => (
                      <option key={school.schoolCode} value={school.school}>
                        {school.school}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column xs={12}>
                  School ID
                </Form.Label>
                <Col xs={12}>
                  <FloatingLabel label="School ID">
                    <Form.Control
                      type="text"
                      name="schoolID"
                      value={formData.schoolID}
                      placeholder="School ID"
                      readOnly
                      required
                    />
                  </FloatingLabel>
                </Col>
              </Form.Group>

              {/* Fields specific to new account request */}
              {formData.requestType === "new" && (
                <>
                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12}>
                      Designation
                    </Form.Label>
                    <Col xs={12}>
                      <Form.Select
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select Designation --</option>
                        {designations.map((designation) => (
                          <option
                            key={designation.id}
                            value={designation.designation}
                          >
                            {designation.designation}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12}>
                      Personal Gmail
                    </Form.Label>
                    <Col xs={12}>
                      <FloatingLabel label="Personal Gmail Account">
                        <Form.Control
                          type="email"
                          name="personalGmail"
                          value={formData.personalGmail}
                          onChange={handleChange}
                          placeholder="name@gmail.com"
                          required
                        />
                      </FloatingLabel>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12}>
                      Submit a photo of you with any valid ID
                    </Form.Label>
                    <Col xs={12}>
                      <Form.Control
                        type="file"
                        name="proofOfIdentity"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.pdf"
                        required
                      />
                      {formData.attachmentPreviews.map(
                        (file, index) =>
                          file.type === "proofOfIdentity" && (
                            <div
                              key={index}
                              className="d-flex align-items-center mt-2"
                            >
                              {file.url && (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    marginRight: "10px",
                                  }}
                                />
                              )}
                              <div
                                className="d-flex justify-content-between pe-2"
                                style={{ width: "100%" }}
                              >
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  className="btn text-danger"
                                  onClick={() =>
                                    handleRemoveAttachment("proofOfIdentity")
                                  }
                                >
                                  <FaRegTrashAlt />
                                </button>
                              </div>
                            </div>
                          )
                      )}
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12}>
                      PRC ID
                    </Form.Label>
                    <Col xs={12}>
                      <Form.Control
                        type="file"
                        name="prcID"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.pdf"
                        required
                      />
                      {formData.attachmentPreviews.map(
                        (file, index) =>
                          file.type === "prcID" && (
                            <div
                              key={index}
                              className="d-flex align-items-center mt-2"
                            >
                              {file.url && (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    marginRight: "10px",
                                  }}
                                />
                              )}
                              <div
                                className="d-flex justify-content-between pe-2"
                                style={{ width: "100%" }}
                              >
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  className="btn text-danger"
                                  onClick={() =>
                                    handleRemoveAttachment("prcID")
                                  }
                                >
                                  <FaRegTrashAlt />
                                </button>
                              </div>
                            </div>
                          )
                      )}
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12}>
                      Endorsement Letter
                    </Form.Label>
                    <Col xs={12}>
                      <Form.Control
                        type="file"
                        name="endorsementLetter"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.pdf"
                        required
                      />
                      {formData.attachmentPreviews.map(
                        (file, index) =>
                          file.type === "endorsementLetter" && (
                            <div
                              key={index}
                              className="d-flex align-items-center mt-2"
                            >
                              {file.url && (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    marginRight: "10px",
                                  }}
                                />
                              )}
                              <div
                                className="d-flex justify-content-between pe-2"
                                style={{ width: "100%" }}
                              >
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  className="btn text-danger"
                                  onClick={() =>
                                    handleRemoveAttachment("endorsementLetter")
                                  }
                                >
                                  <FaRegTrashAlt />
                                </button>
                              </div>
                            </div>
                          )
                      )}
                    </Col>
                  </Form.Group>
                </>
              )}

              {/* Fields specific to reset account request */}
              {formData.requestType === "reset" && (
                <Form.Group as={Row} className="mb-3">
                  <Form.Label column xs={12}>
                    Employee Number
                  </Form.Label>
                  <Col xs={12}>
                    <FloatingLabel label="Employee Number">
                      <Form.Control
                        type="text"
                        name="employeeNumber"
                        value={formData.employeeNumber}
                        onChange={handleChange}
                        placeholder="Employee Number"
                        required
                      />
                    </FloatingLabel>
                  </Col>
                </Form.Group>
              )}
            </>
          )}

          {formData.selectedType && (
            <>
              <p style={{ fontSize: "0.875rem", textAlign: "justify" }}>
                I hereby authorize the Department of Education (DepEd) to collect,
                process, store, and use my personal information provided in this
                form for official purposes, including the creation and management
                of my DepEd account, in accordance with Republic Act No. 10173
                (Data Privacy Act of 2012).
                <br />
                <br />
                I certify that the information I have provided is true, correct,
                and complete. I understand that my data will be handled with
                confidentiality and used only by authorized personnel.
              </p>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="deped-ra-mobile"
                  name="isDepedRA"
                  label="I agree / I give my consent"
                  checked={formData.isDepedRA}
                  onChange={handleChange}
                />
              </Form.Group>
            </>
          )}

          <div className="d-flex justify-content-center mb-4 mt-4">
            <Button
              variant="dark"
              type="submit"
              className="w-100 py-2"
              disabled={isSubmitting || !formData.selectedType}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>

      {/* Tablet and Desktop view (with container) */}
      <Container className="mt-5 d-none d-md-block">
        <form onSubmit={handleSubmit}>
          <Card
            className="m-auto"
            style={{
              width: "70%",
              border: "none",
              boxShadow: "2px 2px 10px 2px rgba(0, 0, 0, 0.15)",
              height: "85vh",
              overflowY: "auto",
            }}
          >
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}

            <Card.Body>
              <div className="mb-4">
                <h3 className="fs-1">DepEd Account Request</h3>
              </div>

              {/* Conditional form fields based on request type */}
              {formData.requestType && (
                <Form.Group as={Row} className="mb-3">
                  <Form.Label column xs={12} sm={12} md={3} lg={2}>
                    Account Type
                  </Form.Label>
                  <Col xs={12} sm={12} md={9} lg={10}>
                    <Form.Select
                      value={formData.selectedType}
                      name="selectedType"
                      onChange={handleTypeChange}
                      required
                    >
                      <option value="">-- Select Account Type --</option>
                      <option value="gmail">DepEd Gmail Account</option>
                      <option value="office365">Office 365 Account</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              )}

              {/* Common fields for both request types */}
              {formData.selectedType && (
                <>
                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12} sm={12} md={3} lg={2}>
                      Name
                    </Form.Label>
                    <Col xs={12} sm={12} md={9} lg={10}>
                      <Row>
                        <Col md={4}>
                          <FloatingLabel label="Surname">
                            <Form.Control
                              type="text"
                              name="surname"
                              value={formData.surname || ""}
                              onChange={handleChange}
                              placeholder="Surname"
                              required
                            />
                          </FloatingLabel>
                        </Col>
                        <Col md={4}>
                          <FloatingLabel label="First Name">
                            <Form.Control
                              type="text"
                              name="firstName"
                              value={formData.firstName || ""}
                              onChange={handleChange}
                              placeholder="First Name"
                              required
                            />
                          </FloatingLabel>
                        </Col>
                        <Col md={4}>
                          <FloatingLabel label="Middle Name">
                            <Form.Control
                              type="text"
                              name="middleName"
                              value={formData.middleName || ""}
                              onChange={handleChange}
                              placeholder="Middle Name"
                            />
                          </FloatingLabel>
                        </Col>
                      </Row>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12} sm={12} md={3} lg={2}>
                      School
                    </Form.Label>
                    <Col xs={12} sm={12} md={9} lg={10}>
                      <Form.Select
                        name="school"
                        value={formData.school}
                        onChange={handleSchoolChange}
                        required
                      >
                        <option value="">-- Select School --</option>
                        {schools.map((school) => (
                          <option key={school.schoolCode} value={school.school}>
                            {school.school}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12} sm={12} md={3} lg={2}>
                      School ID
                    </Form.Label>
                    <Col xs={12} sm={12} md={9} lg={10}>
                      <FloatingLabel label="School ID">
                        <Form.Control
                          type="text"
                          name="schoolID"
                          value={formData.schoolID}
                          placeholder="School ID"
                          readOnly
                          required
                        />
                      </FloatingLabel>
                    </Col>
                  </Form.Group>

                  {/* Fields specific to new account request */}
                  {formData.requestType === "new" && (
                    <>
                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column xs={12} sm={12} md={3} lg={2}>
                          Designation
                        </Form.Label>
                        <Col xs={12} sm={12} md={9} lg={10}>
                          <Form.Select
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            required
                          >
                            <option value="">-- Select Designation --</option>
                            {designations.map((designation) => (
                              <option
                                key={designation.id}
                                value={designation.designation}
                              >
                                {designation.designation}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column xs={12} sm={12} md={3} lg={2}>
                          Personal Gmail
                        </Form.Label>
                        <Col xs={12} sm={12} md={9} lg={10}>
                          <FloatingLabel label="Personal Gmail Account">
                            <Form.Control
                              type="email"
                              name="personalGmail"
                              value={formData.personalGmail}
                              onChange={handleChange}
                              placeholder="name@gmail.com"
                              required
                            />
                          </FloatingLabel>
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column xs={12} sm={12} md={3} lg={2}>
                          Submit a photo of yourself holding a valid ID{" "}
                        </Form.Label>
                        <Col xs={12} sm={12} md={9} lg={10}>
                          <Form.Control
                            type="file"
                            name="proofOfIdentity"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                            required
                          />
                          {formData.attachmentPreviews.map(
                            (file, index) =>
                              file.type === "proofOfIdentity" && (
                                <div
                                  key={index}
                                  className="d-flex align-items-center mt-2"
                                >
                                  {file.url && (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      style={{
                                        width: "50px",
                                        height: "50px",
                                        marginRight: "10px",
                                      }}
                                    />
                                  )}
                                  <div
                                    className="d-flex justify-content-between pe-2"
                                    style={{ width: "100%" }}
                                  >
                                    <span>{file.name}</span>
                                    <button
                                      type="button"
                                      className="btn text-danger"
                                      onClick={() =>
                                        handleRemoveAttachment(
                                          "proofOfIdentity"
                                        )
                                      }
                                    >
                                      <FaRegTrashAlt />
                                    </button>
                                  </div>
                                </div>
                              )
                          )}
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column xs={12} sm={12} md={3} lg={2}>
                          PRC ID
                        </Form.Label>
                        <Col xs={12} sm={12} md={9} lg={10}>
                          <Form.Control
                            type="file"
                            name="prcID"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                            required
                          />
                          {formData.attachmentPreviews.map(
                            (file, index) =>
                              file.type === "prcID" && (
                                <div
                                  key={index}
                                  className="d-flex align-items-center mt-2"
                                >
                                  {file.url && (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      style={{
                                        width: "50px",
                                        height: "50px",
                                        marginRight: "10px",
                                      }}
                                    />
                                  )}
                                  <div
                                    className="d-flex justify-content-between pe-2"
                                    style={{ width: "100%" }}
                                  >
                                    <span>{file.name}</span>
                                    <button
                                      type="button"
                                      className="btn text-danger"
                                      onClick={() =>
                                        handleRemoveAttachment("prcID")
                                      }
                                    >
                                      <FaRegTrashAlt />
                                    </button>
                                  </div>
                                </div>
                              )
                          )}
                        </Col>
                      </Form.Group>

                      {/* dito copy */}
                      <Form.Group as={Row} className="mb-3">
                        <Form.Label column xs={12} sm={12} md={3} lg={2}>
                          Endorsement Letter
                        </Form.Label>
                        <Col xs={12} sm={12} md={9} lg={10}>
                          {/* Download link for endorsement letter template */}
                          <a
                            href="https://docs.google.com/document/d/16FdN46utYzlT24PNWgKP82KUc2lWg3tu/export?format=docx"
                            className="d-block mb-2"
                            download="Endorsement_Letter_Template.docx"
                          >
                            Download Endorsement Letter Template
                          </a>

                          {/* File Input at full width */}
                          <Form.Control
                            type="file"
                            name="endorsementLetter"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                            required
                            className="mb-2"
                          />

                          {/* File preview section */}
                          {formData.attachmentPreviews.map(
                            (file, index) =>
                              file.type === "endorsementLetter" && (
                                <div
                                  key={index}
                                  className="d-flex align-items-center mt-2"
                                >
                                  {file.url && (
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      style={{
                                        width: "50px",
                                        height: "50px",
                                        marginRight: "10px",
                                      }}
                                    />
                                  )}
                                  <div
                                    className="d-flex justify-content-between pe-2"
                                    style={{ width: "100%" }}
                                  >
                                    <span>{file.name}</span>
                                    <button
                                      type="button"
                                      className="btn text-danger"
                                      onClick={() =>
                                        handleRemoveAttachment(
                                          "endorsementLetter"
                                        )
                                      }
                                    >
                                      <FaRegTrashAlt />
                                    </button>
                                  </div>
                                </div>
                              )
                          )}
                        </Col>
                      </Form.Group>
                    </>
                  )}

                  {/* Fields specific to reset account request */}
{formData.requestType === "reset" && (
  <>
    {/* Employee Number Field */}
    <Form.Group as={Row} className="mb-3">
      <Form.Label column xs={12} sm={12} md={3} lg={2}>
        Employee Number
      </Form.Label>
      <Col xs={12} sm={12} md={9} lg={10}>
        <FloatingLabel label="Employee Number">
          <Form.Control
            type="text"
            name="employeeNumber"
            value={formData.employeeNumber}
            onChange={handleChange}
            placeholder="Employee Number"
            required
          />
        </FloatingLabel>
      </Col>
    </Form.Group>

    {/* Personal Email Field - Now consistent with Employee Number */}
    <Form.Group as={Row} className="mb-3">
      <Form.Label column xs={12} sm={12} md={3} lg={2}>
        Personal Email
      </Form.Label>
      <Col xs={12} sm={12} md={9} lg={10}>
        <FloatingLabel label="Personal Email">
          <Form.Control
            type="email"
            name="personalEmail"
            value={formData.personalEmail}
            onChange={handleChange}
            required
            placeholder="Enter your personal email address"
          />
        </FloatingLabel>
        <Form.Text className="text-muted">
          This will be used to contact you about your reset request.
        </Form.Text>
      </Col>
    </Form.Group>

    
    <Form.Group as={Row} className="mb-3">
  <Form.Label column xs={12} sm={12} md={3} lg={2}>
    DepEd Email
  </Form.Label>
  <Col xs={12} sm={12} md={9} lg={10}>
    <FloatingLabel label="DepEd Email to be reset">
      <Form.Control
        type="email"
        name="deped_email" // Changed to match backend
        value={formData.deped_email}
        onChange={handleChange}
        required
        placeholder="Enter your DepEd email address to be reset"
      />
    </FloatingLabel>
    <Form.Text className="text-muted">
      The DepEd email account you want to reset (must end with @deped.gov.ph)
    </Form.Text>
  </Col>
</Form.Group>
  </>
)}


                    

                </>
              )}
            </Card.Body>

            <Card.Footer
              className="d-flex flex-column mb-3"
              style={{ backgroundColor: "transparent", border: "none" }}
            >
              {formData.selectedType && (
                <div className="w-100">
                  <p style={{ fontSize: "0.875rem", textAlign: "justify" }}>
                    I hereby authorize the Department of Education (DepEd) to
                    collect, process, store, and use my personal information
                    provided in this form for official purposes, including the
                    creation and management of my DepEd account, in accordance
                    with Republic Act No. 10173 (Data Privacy Act of 2012).
                    <br />
                    <br />
                    I certify that the information I have provided is true,
                    correct, and complete. I understand that my data will be
                    handled with confidentiality and used only by authorized
                    personnel.
                  </p>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="deped-ra-desktop"
                      name="isDepedRA"
                      label="I agree / I give my consent"
                      checked={formData.isDepedRA}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              )}
              <Button
                variant="dark"
                type="submit"
                style={{ width: "25%", alignSelf: "center" }}
                disabled={isSubmitting || !formData.selectedType}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </Card.Footer>
          </Card>
        </form>
      </Container>

      {/* Modal */}
      <Modal
        show={showSuccessModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Success!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {submittedRequestType === "new"
              ? "New Account request"
              : "Reset Account request"}{" "}
            has been submitted successfully!
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleCloseModal}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RequestDepedAccount;
