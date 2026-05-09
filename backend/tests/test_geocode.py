import app as app_module


class MockResponse:
    def __init__(self, payload, ok=True):
        self._payload = payload
        self.ok = ok

    def json(self):
        return self._payload


def test_geocode_accepts_matching_zip(client, monkeypatch):
    def mock_get(url, params=None, timeout=10):
        return MockResponse({
            "features": [
                {
                    "place_name": "1 Washington Sq, San Jose, California 95112, United States",
                    "geometry": {
                        "coordinates": [-121.881, 37.3352]
                    },
                    "properties": {
                        "full_address": "1 Washington Sq, San Jose, CA 95112",
                        "context": {
                            "postcode": {
                                "name": "95112"
                            }
                        }
                    }
                }
            ]
        })

    monkeypatch.setattr(app_module.requests, "get", mock_get)

    response = client.get(
        "/geocode",
        query_string={
            "addressLine1": "1 Washington Sq",
            "city": "San Jose",
            "zipCode": "95112",
        },
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["place_name"] == "1 Washington Sq, San Jose, CA 95112"


def test_geocode_rejects_mismatched_zip(client, monkeypatch):
    def mock_get(url, params=None, timeout=10):
        return MockResponse({
            "features": [
                {
                    "place_name": "1 Washington Sq, San Jose, California 95112, United States",
                    "geometry": {
                        "coordinates": [-121.881, 37.3352]
                    },
                    "properties": {
                        "full_address": "1 Washington Sq, San Jose, CA 95112",
                        "context": {
                            "postcode": {
                                "name": "95112"
                            }
                        }
                    }
                }
            ]
        })

    monkeypatch.setattr(app_module.requests, "get", mock_get)

    response = client.get(
        "/geocode",
        query_string={
            "addressLine1": "1 Washington Sq",
            "city": "San Jose",
            "zipCode": "95111",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "ZIP code does not match the delivery address"
