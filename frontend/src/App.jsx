import { useEffect, useState } from "react";
import Login from "./Login";
import Admin from "./Admin";

function App() {
  const API_KEY = "123456";
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [page, setPage] = useState(1);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subdistrictId, setSubdistrictId] = useState("");

  const [selectedVillage, setSelectedVillage] = useState(null);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // ================================
  // 🔹 LOAD STATES (FIXED)
  // ================================
  useEffect(() => {
    fetch("http://localhost:3000/v1/states", {
      headers: { "x-api-key": API_KEY }
    })
      .then(res => res.json())
      .then(data => {
        const sorted = data.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setStates(sorted);
      });
  }, []);

  // ================================
  // 🔹 DISTRICTS
  // ================================
  const getDistricts = (id) => {
    setStateId(id);
    setDistrictId("");
    setSubdistrictId("");
    setSelectedVillage(null);

    fetch(`http://localhost:3000/v1/states/${id}/districts`, {
      headers: { "x-api-key": API_KEY }
    })
      .then(res => res.json())
      .then(data => {
        const sorted = data.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setDistricts(sorted);
        setSubdistricts([]);
        setVillages([]);
      });
  };

  // ================================
  // 🔹 SUBDISTRICTS
  // ================================
  const getSubdistricts = (id) => {
    setDistrictId(id);
    setSubdistrictId("");
    setSelectedVillage(null);

    fetch(`http://localhost:3000/v1/districts/${id}/subdistricts`, {
      headers: { "x-api-key": API_KEY }
    })
      .then(res => res.json())
      .then(data => {
        const sorted = data.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setSubdistricts(sorted);
        setVillages([]);
      });
  };

  // ================================
  // 🔹 VILLAGES + PAGINATION
  // ================================
  const getVillages = (id, pageNumber = 1) => {
    if (!id) return;

    setSubdistrictId(id);
    setSelectedVillage(null);
    setPage(pageNumber);

    fetch(`http://localhost:3000/v1/subdistricts/${id}/villages?page=${pageNumber}&limit=50`, {
      headers: { "x-api-key": API_KEY }
    })
      .then(res => res.json())
      .then(data => {
        const sorted = data.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setVillages(sorted);
      });
  };

  // ================================
  // 🔍 SEARCH (FINAL FIXED)
  // ================================
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }

    fetch(`http://localhost:3000/v1/search?q=${search}`, {
      headers: { "x-api-key": API_KEY }
    })
      .then(res => res.json())
      .then(data => {
        setSearchResults(data.data); // already formatted from backend
      });
  }, [search]);

  if (!token) {
  return <Login setToken={setToken} />;
}

return (
  <div style={{ padding: "30px", fontFamily: "Arial" }}>

    <button onClick={() => {
      localStorage.removeItem("token");
      setToken(null);
    }}>
      Logout
    </button>

    <h2>🌍 Village Selector</h2>

    {/* ================= STATE ================= */}
    <select onChange={(e) => getDistricts(e.target.value)}>
      <option>Select State</option>
      {states.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>

    <br /><br />

    {/* ================= DISTRICT ================= */}
    <select onChange={(e) => getSubdistricts(e.target.value)}>
      <option>Select District</option>
      {districts.map(d => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>

    <br /><br />

    {/* ================= SUBDISTRICT ================= */}
    <select onChange={(e) => getVillages(e.target.value)}>
      <option>Select Subdistrict</option>
      {subdistricts.map(sd => (
        <option key={sd.id} value={sd.id}>{sd.name}</option>
      ))}
    </select>

    <br /><br />

    {/* ================= VILLAGE ================= */}
    <select onChange={(e) => {
      const village = villages.find(v => v.id == e.target.value);
      setSelectedVillage(village);
    }}>
      <option>Select Village</option>
      {villages.map(v => (
        <option key={v.id} value={v.id}>{v.name}</option>
      ))}
    </select>

    <br /><br />

    {/* ================= PAGINATION ================= */}
    <button
      onClick={() => getVillages(subdistrictId, page - 1)}
      disabled={page <= 1}
    >
      ⬅ Prev
    </button>

    <span style={{ margin: "0 10px" }}>
      Page {page}
    </span>

    <button
      onClick={() => getVillages(subdistrictId, page + 1)}
      disabled={!subdistrictId}
    >
      Next ➡
    </button>

    <br /><br />

    {/* ================= FULL ADDRESS ================= */}
    {selectedVillage && (
      <h3>
        📍 {selectedVillage.name},{" "}
        {subdistricts.find(s => s.id == subdistrictId)?.name},{" "}
        {districts.find(d => d.id == districtId)?.name},{" "}
        {states.find(s => s.id == stateId)?.name}, India
      </h3>
    )}

    <hr />

    {/* ================= SEARCH ================= */}
    <h3>🔍 Search Village</h3>

    <input
      placeholder="Type village name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    <ul>
      {searchResults.map(v => (
        <li
          key={v.value}
          style={{ cursor: "pointer", margin: "5px 0" }}
          onClick={() => {
            setSelectedVillage(v);
            setSearch("");
            setSearchResults([]);
          }}
        >
          📍 {v.fullAddress}
        </li>
      ))}
    </ul>

  </div>
);
}

export default App;