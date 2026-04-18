from news_brief_mvp.live_retriever import _clean_title, _normalize_text


def test_normalize_text_collapses_nbsp_and_extra_spaces() -> None:
    assert _normalize_text("US\xa0\xa0chip exports   tighten") == "US chip exports tighten"


def test_clean_title_removes_trailing_source_after_nonbreaking_spaces() -> None:
    raw_title = "US mulls new rules for AI chip exports, including requiring US investments by foreign firms\xa0\xa0Reuters"
    assert _clean_title(raw_title, "Reuters") == (
        "US mulls new rules for AI chip exports, including requiring US investments by foreign firms"
    )


def test_clean_title_removes_dash_source_suffix() -> None:
    assert _clean_title("US mulls new AI chip export rules - Reuters", "Reuters") == (
        "US mulls new AI chip export rules"
    )
