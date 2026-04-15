import { useEffect, useState } from "react";

function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_KEY = "123456";
  const TOKEN = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:3000/v1/admin/stats", {
      headers: {
        "x-api-key": API_KEY,
        "authorization": TOKEN
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h2>📊 Admin Dashboard</h2>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>

          <div style={cardStyle}>
            <h3>States</h3>
            <p style={numberStyle}>{stats.states}</p>
          </div>

          <div style={cardStyle}>
            <h3>Districts</h3>
            <p style={numberStyle}>{stats.districts}</p>
          </div>

          <div style={cardStyle}>
            <h3>Subdistricts</h3>
            <p style={numberStyle}>{stats.subdistricts}</p>
          </div>

          <div style={cardStyle}>
            <h3>Villages</h3>
            <p style={numberStyle}>{stats.villages}</p>
          </div>

        </div>
      )}
    </div>
  );
}

// 🎨 Styles
const cardStyle = {
  background: "#f4f4f4",
  padding: "20px",
  borderRadius: "10px",
  width: "150px",
  textAlign: "center",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)"
};

const numberStyle = {
  fontSize: "24px",
  fontWeight: "bold"
};

export default Admin;