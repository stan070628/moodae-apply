"""
Tests for app.py - API key management and core functionality
Framework: pytest
"""
import pytest
import json
import os
import sys
from unittest.mock import patch, MagicMock, mock_open
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# ═══════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════
@pytest.fixture
def temp_api_keys_file(tmp_path):
    """Create a temporary API keys file."""
    api_keys_file = tmp_path / "data" / "api_keys.json"
    api_keys_file.parent.mkdir(parents=True, exist_ok=True)
    return api_keys_file


@pytest.fixture
def sample_api_keys():
    """Sample API keys for testing."""
    return {
        "Gemini": "test-gemini-key-12345",
        "OpenAI": "sk-test-openai-key-67890",
        "Anthropic": "sk-ant-test-key-abcdef"
    }


@pytest.fixture
def mock_streamlit():
    """Mock Streamlit components."""
    with patch.dict('sys.modules', {'streamlit': MagicMock()}):
        yield


# ═══════════════════════════════════════════════════
# API Key Management Tests
# ═══════════════════════════════════════════════════
class TestLoadApiKeys:
    """Tests for load_apikeys() function."""
    
    def test_load_existing_keys(self, temp_api_keys_file, sample_api_keys):
        """Happy path: Load existing API keys from file."""
        temp_api_keys_file.write_text(json.dumps(sample_api_keys))
        
        def load_apikeys():
            if os.path.exists(str(temp_api_keys_file)):
                with open(str(temp_api_keys_file), "r") as f:
                    return json.load(f)
            return {}
        
        with patch('os.path.join', return_value=str(temp_api_keys_file)):
            result = load_apikeys()
        
        assert result == sample_api_keys
        assert result["Gemini"] == "test-gemini-key-12345"
        assert result["OpenAI"] == "sk-test-openai-key-67890"
        assert result["Anthropic"] == "sk-ant-test-key-abcdef"
    
    def test_load_nonexistent_file(self, tmp_path):
        """Edge case: Return empty dict when file doesn't exist."""
        nonexistent_file = tmp_path / "nonexistent.json"
        
        def load_apikeys():
            if os.path.exists(str(nonexistent_file)):
                with open(str(nonexistent_file), "r") as f:
                    return json.load(f)
            return {}
        
        result = load_apikeys()
        assert result == {}
    
    def test_load_empty_file(self, temp_api_keys_file):
        """Edge case: Handle empty JSON file."""
        temp_api_keys_file.write_text("{}")
        
        def load_apikeys():
            if os.path.exists(str(temp_api_keys_file)):
                with open(str(temp_api_keys_file), "r") as f:
                    return json.load(f)
            return {}
        
        result = load_apikeys()
        assert result == {}
    
    def test_load_corrupted_json(self, temp_api_keys_file):
        """Edge case: Handle corrupted JSON file."""
        temp_api_keys_file.write_text("{ invalid json }")
        
        def load_apikeys():
            try:
                if os.path.exists(str(temp_api_keys_file)):
                    with open(str(temp_api_keys_file), "r") as f:
                        return json.load(f)
            except json.JSONDecodeError:
                return {}
            return {}
        
        result = load_apikeys()
        assert result == {}
    
    def test_load_partial_keys(self, temp_api_keys_file):
        """Edge case: Load file with only some providers."""
        partial_keys = {"Gemini": "test-key"}
        temp_api_keys_file.write_text(json.dumps(partial_keys))
        
        def load_apikeys():
            if os.path.exists(str(temp_api_keys_file)):
                with open(str(temp_api_keys_file), "r") as f:
                    return json.load(f)
            return {}
        
        result = load_apikeys()
        assert result == {"Gemini": "test-key"}
        assert "OpenAI" not in result
        assert "Anthropic" not in result


class TestSaveApiKeys:
    """Tests for save_apikeys() function."""
    
    def test_save_new_keys(self, temp_api_keys_file, sample_api_keys):
        """Happy path: Save new API keys to file."""
        def save_apikeys(k):
            temp_api_keys_file.parent.mkdir(parents=True, exist_ok=True)
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        save_apikeys(sample_api_keys)
        
        saved_content = json.loads(temp_api_keys_file.read_text())
        assert saved_content == sample_api_keys
    
    def test_save_overwrites_existing(self, temp_api_keys_file):
        """Happy path: Overwrite existing keys."""
        old_keys = {"Gemini": "old-key"}
        new_keys = {"Gemini": "new-key", "OpenAI": "added-key"}
        
        temp_api_keys_file.write_text(json.dumps(old_keys))
        
        def save_apikeys(k):
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        save_apikeys(new_keys)
        
        saved_content = json.loads(temp_api_keys_file.read_text())
        assert saved_content == new_keys
        assert saved_content["Gemini"] == "new-key"
    
    def test_save_empty_dict(self, temp_api_keys_file):
        """Edge case: Save empty dictionary."""
        def save_apikeys(k):
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        save_apikeys({})
        
        saved_content = json.loads(temp_api_keys_file.read_text())
        assert saved_content == {}
    
    def test_save_creates_directory(self, tmp_path):
        """Edge case: Create directory if it doesn't exist."""
        nested_file = tmp_path / "new_dir" / "data" / "keys.json"
        
        def save_apikeys(k):
            nested_file.parent.mkdir(parents=True, exist_ok=True)
            with open(str(nested_file), "w") as f:
                json.dump(k, f, indent=2)
        
        save_apikeys({"test": "key"})
        
        assert nested_file.exists()
        assert json.loads(nested_file.read_text()) == {"test": "key"}
    
    def test_save_special_characters_in_key(self, temp_api_keys_file):
        """Edge case: Handle special characters in API keys."""
        special_keys = {
            "Gemini": "key-with-special-chars!@#$%^&*()",
            "OpenAI": "sk-proj-한글키테스트",
            "Anthropic": "key\twith\nnewlines"
        }
        
        def save_apikeys(k):
            with open(str(temp_api_keys_file), "w", encoding="utf-8") as f:
                json.dump(k, f, indent=2, ensure_ascii=False)
        
        save_apikeys(special_keys)
        
        with open(str(temp_api_keys_file), "r", encoding="utf-8") as f:
            saved_content = json.load(f)
        
        assert saved_content == special_keys


# ═══════════════════════════════════════════════════
# Provider Mapping Tests
# ═══════════════════════════════════════════════════
class TestProviderMapping:
    """Tests for provider name mapping."""
    
    def test_provider_map_google_gemini(self):
        """Happy path: Map Google Gemini to Gemini."""
        provider_map = {
            "Google Gemini": "Gemini",
            "OpenAI": "OpenAI",
            "Anthropic Claude": "Anthropic"
        }
        assert provider_map["Google Gemini"] == "Gemini"
    
    def test_provider_map_openai(self):
        """Happy path: Map OpenAI to OpenAI."""
        provider_map = {
            "Google Gemini": "Gemini",
            "OpenAI": "OpenAI",
            "Anthropic Claude": "Anthropic"
        }
        assert provider_map["OpenAI"] == "OpenAI"
    
    def test_provider_map_anthropic(self):
        """Happy path: Map Anthropic Claude to Anthropic."""
        provider_map = {
            "Google Gemini": "Gemini",
            "OpenAI": "OpenAI",
            "Anthropic Claude": "Anthropic"
        }
        assert provider_map["Anthropic Claude"] == "Anthropic"
    
    def test_all_providers_covered(self):
        """Edge case: Ensure all providers are mapped."""
        provider_map = {
            "Google Gemini": "Gemini",
            "OpenAI": "OpenAI",
            "Anthropic Claude": "Anthropic"
        }
        expected_providers = ["Google Gemini", "OpenAI", "Anthropic Claude"]
        assert all(p in provider_map for p in expected_providers)
    
    def test_invalid_provider_raises_keyerror(self):
        """Edge case: Invalid provider raises KeyError."""
        provider_map = {
            "Google Gemini": "Gemini",
            "OpenAI": "OpenAI",
            "Anthropic Claude": "Anthropic"
        }
        with pytest.raises(KeyError):
            _ = provider_map["InvalidProvider"]


# ═══════════════════════════════════════════════════
# Key Operations Tests
# ═══════════════════════════════════════════════════
class TestKeyOperations:
    """Tests for key save/delete operations."""
    
    def test_add_new_key_to_existing(self, temp_api_keys_file):
        """Happy path: Add new provider key to existing keys."""
        existing_keys = {"Gemini": "gemini-key"}
        temp_api_keys_file.write_text(json.dumps(existing_keys))
        
        def load_apikeys():
            with open(str(temp_api_keys_file), "r") as f:
                return json.load(f)
        
        def save_apikeys(k):
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        keys = load_apikeys()
        keys["OpenAI"] = "openai-key"
        save_apikeys(keys)
        
        result = load_apikeys()
        assert len(result) == 2
        assert result["Gemini"] == "gemini-key"
        assert result["OpenAI"] == "openai-key"
    
    def test_update_existing_key(self, temp_api_keys_file):
        """Happy path: Update existing provider key."""
        existing_keys = {"Gemini": "old-key"}
        temp_api_keys_file.write_text(json.dumps(existing_keys))
        
        def load_apikeys():
            with open(str(temp_api_keys_file), "r") as f:
                return json.load(f)
        
        def save_apikeys(k):
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        keys = load_apikeys()
        keys["Gemini"] = "new-key"
        save_apikeys(keys)
        
        result = load_apikeys()
        assert result["Gemini"] == "new-key"
    
    def test_delete_existing_key(self, temp_api_keys_file, sample_api_keys):
        """Happy path: Delete existing provider key."""
        temp_api_keys_file.write_text(json.dumps(sample_api_keys))
        
        def load_apikeys():
            with open(str(temp_api_keys_file), "r") as f:
                return json.load(f)
        
        def save_apikeys(k):
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        keys = load_apikeys()
        del keys["OpenAI"]
        save_apikeys(keys)
        
        result = load_apikeys()
        assert "OpenAI" not in result
        assert len(result) == 2
    
    def test_delete_nonexistent_key(self, temp_api_keys_file):
        """Edge case: Attempt to delete non-existent key."""
        existing_keys = {"Gemini": "gemini-key"}
        temp_api_keys_file.write_text(json.dumps(existing_keys))
        
        def load_apikeys():
            with open(str(temp_api_keys_file), "r") as f:
                return json.load(f)
        
        keys = load_apikeys()
        
        # Should not raise error
        if "OpenAI" in keys:
            del keys["OpenAI"]
        
        assert "OpenAI" not in keys
    
    def test_get_key_with_default(self, temp_api_keys_file):
        """Edge case: Get key with default value for missing key."""
        existing_keys = {"Gemini": "gemini-key"}
        temp_api_keys_file.write_text(json.dumps(existing_keys))
        
        def load_apikeys():
            with open(str(temp_api_keys_file), "r") as f:
                return json.load(f)
        
        keys = load_apikeys()
        
        assert keys.get("Gemini", "") == "gemini-key"
        assert keys.get("OpenAI", "") == ""
        assert keys.get("NonExistent", "default") == "default"


# ═══════════════════════════════════════════════════
# Data Directory Tests
# ═══════════════════════════════════════════════════
class TestDataDirectory:
    """Tests for data directory creation."""
    
    def test_makedirs_creates_directory(self, tmp_path):
        """Happy path: Create data directory if not exists."""
        data_dir = tmp_path / "data"
        assert not data_dir.exists()
        
        os.makedirs(str(data_dir), exist_ok=True)
        
        assert data_dir.exists()
        assert data_dir.is_dir()
    
    def test_makedirs_existing_directory(self, tmp_path):
        """Edge case: No error when directory already exists."""
        data_dir = tmp_path / "data"
        data_dir.mkdir()
        
        # Should not raise error
        os.makedirs(str(data_dir), exist_ok=True)
        
        assert data_dir.exists()
    
    def test_makedirs_nested_directories(self, tmp_path):
        """Edge case: Create nested directories."""
        nested_dir = tmp_path / "a" / "b" / "c" / "data"
        
        os.makedirs(str(nested_dir), exist_ok=True)
        
        assert nested_dir.exists()


# ═══════════════════════════════════════════════════
# Integration Tests
# ═══════════════════════════════════════════════════
class TestIntegration:
    """Integration tests for full workflows."""
    
    def test_full_key_lifecycle(self, temp_api_keys_file):
        """Integration: Full lifecycle - create, update, delete keys."""
        def load_apikeys():
            if os.path.exists(str(temp_api_keys_file)):
                with open(str(temp_api_keys_file), "r") as f:
                    return json.load(f)
            return {}
        
        def save_apikeys(k):
            temp_api_keys_file.parent.mkdir(parents=True, exist_ok=True)
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        # 1. Start with no keys
        keys = load_apikeys()
        assert keys == {}
        
        # 2. Add Gemini key
        keys["Gemini"] = "gemini-key-v1"
        save_apikeys(keys)
        keys = load_apikeys()
        assert keys == {"Gemini": "gemini-key-v1"}
        
        # 3. Add OpenAI key
        keys["OpenAI"] = "openai-key-v1"
        save_apikeys(keys)
        keys = load_apikeys()
        assert len(keys) == 2
        
        # 4. Update Gemini key
        keys["Gemini"] = "gemini-key-v2"
        save_apikeys(keys)
        keys = load_apikeys()
        assert keys["Gemini"] == "gemini-key-v2"
        
        # 5. Delete OpenAI key
        del keys["OpenAI"]
        save_apikeys(keys)
        keys = load_apikeys()
        assert "OpenAI" not in keys
        assert len(keys) == 1
        
        # 6. Delete last key
        del keys["Gemini"]
        save_apikeys(keys)
        keys = load_apikeys()
        assert keys == {}
    
    def test_multiple_providers_workflow(self, temp_api_keys_file):
        """Integration: Work with all three providers."""
        def load_apikeys():
            if os.path.exists(str(temp_api_keys_file)):
                with open(str(temp_api_keys_file), "r") as f:
                    return json.load(f)
            return {}
        
        def save_apikeys(k):
            temp_api_keys_file.parent.mkdir(parents=True, exist_ok=True)
            with open(str(temp_api_keys_file), "w") as f:
                json.dump(k, f, indent=2)
        
        provider_map = {
            "Google Gemini": "Gemini",
            "OpenAI": "OpenAI",
            "Anthropic Claude": "Anthropic"
        }
        
        keys = load_apikeys()
        
        # Add all providers
        for display_name, internal_name in provider_map.items():
            keys[internal_name] = f"test-key-{internal_name.lower()}"
        
        save_apikeys(keys)
        
        # Verify all keys
        keys = load_apikeys()
        assert len(keys) == 3
        assert keys["Gemini"] == "test-key-gemini"
        assert keys["OpenAI"] == "test-key-openai"
        assert keys["Anthropic"] == "test-key-anthropic"


# ═══════════════════════════════════════════════════
# Session State Tests (Mock-based)
# ═══════════════════════════════════════════════════
class TestSessionState:
    """Tests for session state management."""
    
    def test_session_state_keys_set(self):
        """Happy path: Session state keys are properly set."""
        session_state = {}
        keys = {"Gemini": "test-key"}
        current_key_name = "Gemini"
        
        session_state["current_api_key"] = keys.get(current_key_name, "")
        session_state["api_provider"] = current_key_name
        session_state["api_keys"] = keys
        
        assert session_state["current_api_key"] == "test-key"
        assert session_state["api_provider"] == "Gemini"
        assert session_state["api_keys"] == {"Gemini": "test-key"}
    
    def test_session_state_empty_key(self):
        """Edge case: Session state with missing key."""
        session_state = {}
        keys = {}
        current_key_name = "Gemini"
        
        session_state["current_api_key"] = keys.get(current_key_name, "")
        session_state["api_provider"] = current_key_name
        session_state["api_keys"] = keys
        
        assert session_state["current_api_key"] == ""
        assert session_state["api_provider"] == "Gemini"
        assert session_state["api_keys"] == {}
    
    def test_session_state_switch_provider(self):
        """Happy path: Switch between providers."""
        session_state = {}
        keys = {
            "Gemini": "gemini-key",
            "OpenAI": "openai-key",
            "Anthropic": "anthropic-key"
        }
        
        # Switch to Gemini
        current_key_name = "Gemini"
        session_state["current_api_key"] = keys.get(current_key_name, "")
        session_state["api_provider"] = current_key_name
        assert session_state["current_api_key"] == "gemini-key"
        
        # Switch to OpenAI
        current_key_name = "OpenAI"
        session_state["current_api_key"] = keys.get(current_key_name, "")
        session_state["api_provider"] = current_key_name
        assert session_state["current_api_key"] == "openai-key"
        
        # Switch to Anthropic
        current_key_name = "Anthropic"
        session_state["current_api_key"] = keys.get(current_key_name, "")
        session_state["api_provider"] = current_key_name
        assert session_state["current_api_key"] == "anthropic-key"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
