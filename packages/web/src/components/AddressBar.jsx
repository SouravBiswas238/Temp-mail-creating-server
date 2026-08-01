import CopyButton from "./CopyButton.jsx";

export default function AddressBar({ address, onRegenerate }) {
  return (
    <div className="address-bar">
      <input className="address-input" readOnly value={address} />
      <CopyButton value={address} />
      <button type="button" className="btn btn-regenerate" onClick={onRegenerate}>
        New random address
      </button>
    </div>
  );
}
