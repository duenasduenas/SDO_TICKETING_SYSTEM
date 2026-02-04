import React, { useState, useEffect } from "react";
import { Form, Button, Container, Card, Row, Col, Alert, FloatingLabel } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";

const ResetDepedAccount = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    selectedType: "",
    surname: "",
    firstName: "",
    middleName: "",
    school: "",
    schoolID: "",
    employeeNumber: "",
    personalEmail: "",
    deped_email: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/depedacc/schoolList`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        const data = await response.json();
        setSchools(data);
        setError("");
      } catch (err) {
        console.error("Error fetching schools:", err);
        setError("Error fetching schools. Please check your network and server.");
        setSchools([]);
      }
    };

    fetchSchools();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSchoolChange = (e) => {
    const selectedSchoolName = e.target.value;
    const selectedSchool = schools.find((school) => school.school === selectedSchoolName);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const {
      selectedType,
      surname,
      firstName,
      middleName,
      school,
      schoolID,
      employeeNumber,
      personalEmail,
      deped_email,
    } = formData;

    if (!selectedType || !surname || !firstName || !school || !schoolID || !employeeNumber || !personalEmail || !deped_email) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (!deped_email.endsWith("@deped.gov.ph")) {
      setError("DepEd email must end with @deped.gov.ph");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/depedacc/reset-deped-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          selectedType,
          surname,
          firstName,
          middleName: middleName || "",
          school,
          schoolID,
          employeeNumber,
          personalEmail,
          deped_email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const resetNumber = data.resetNumber;

        Swal.fire({
          title: "Success!",
          html: `Reset Account request has been submitted successfully!<br><br>Request Number: <b>${resetNumber}</b><br><br>Please screenshot to check your status`,
          icon: "success",
          confirmButtonText: "Done",
          willClose: () => {
            navigate("/");
          },
        });

        setFormData({
          selectedType: "",
          surname: "",
          firstName: "",
          middleName: "",
          school: "",
          schoolID: "",
          employeeNumber: "",
          personalEmail: "",
          deped_email: "",
        });
      } else {
        const errorText = await response.text();
        console.error("Server responded with an error:", errorText);
        setError(`Failed to submit request: ${response.status} - ${errorText || response.statusText}`);
      }
    } catch (err) {
      console.error("Error submitting reset request:", err);
      setError(`Error submitting request: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile view */}
      <div className="d-block d-md-none mt-4 px-2">
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <div className="mb-4">
            <h3>Reset Existing DepEd Account</h3>
          </div>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column xs={12}>
              Account Type
            </Form.Label>
            <Col xs={12}>
              <Form.Select
                name="selectedType"
                value={formData.selectedType}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Account Type --</option>
                <option value="gmail">DepEd Gmail Account</option>
                <option value="office365">Office 365 Account</option>
              </Form.Select>
            </Col>
          </Form.Group>

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
                          value={formData.surname}
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
                          value={formData.firstName}
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
                          value={formData.middleName}
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

              <Form.Group as={Row} className="mb-3">
                <Form.Label column xs={12}>
                  Personal Email
                </Form.Label>
                <Col xs={12}>
                  <FloatingLabel label="Personal Email">
                    <Form.Control
                      type="email"
                      name="personalEmail"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                    />
                  </FloatingLabel>
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column xs={12}>
                  DepEd Email
                </Form.Label>
                <Col xs={12}>
                  <FloatingLabel label="DepEd Email (@deped.gov.ph)">
                    <Form.Control
                      type="email"
                      name="deped_email"
                      value={formData.deped_email}
                      onChange={handleChange}
                      placeholder="name@deped.gov.ph"
                      required
                    />
                  </FloatingLabel>
                </Col>
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

      {/* Tablet and Desktop view */}
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
                <h3 className="fs-1">Reset Existing DepEd Account</h3>
              </div>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column xs={12} sm={12} md={3} lg={2}>
                  Account Type
                </Form.Label>
                <Col xs={12} sm={12} md={9} lg={10}>
                  <Form.Select
                    name="selectedType"
                    value={formData.selectedType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Account Type --</option>
                    <option value="gmail">DepEd Gmail Account</option>
                    <option value="office365">Office 365 Account</option>
                  </Form.Select>
                </Col>
              </Form.Group>

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
                              value={formData.surname}
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
                              value={formData.firstName}
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
                              value={formData.middleName}
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
                          placeholder="name@example.com"
                          required
                        />
                      </FloatingLabel>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column xs={12} sm={12} md={3} lg={2}>
                      DepEd Email
                    </Form.Label>
                    <Col xs={12} sm={12} md={9} lg={10}>
                      <FloatingLabel label="DepEd Email (@deped.gov.ph)">
                        <Form.Control
                          type="email"
                          name="deped_email"
                          value={formData.deped_email}
                          onChange={handleChange}
                          placeholder="name@deped.gov.ph"
                          required
                        />
                      </FloatingLabel>
                    </Col>
                  </Form.Group>
                </>
              )}

              <div className="d-flex justify-content-center mb-4 mt-4">
                <Button
                  variant="dark"
                  type="submit"
                  className="w-50 py-2"
                  disabled={isSubmitting || !formData.selectedType}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </form>
      </Container>
    </>
  );
};

export default ResetDepedAccount;
