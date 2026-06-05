from fastapi.testclient import TestClient

from news_brief_mvp.main import create_app


def _client():
    return TestClient(create_app())


def test_root_serves_react_shell():
    response = _client().get("/")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_product_route_serves_react_shell():
    response = _client().get("/product")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_access_route_serves_react_shell():
    response = _client().get("/access")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_about_route_serves_react_shell():
    response = _client().get("/about")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_pricing_route_is_removed():
    response = _client().get("/pricing")
    assert response.status_code == 404
