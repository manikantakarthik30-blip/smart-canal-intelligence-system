from pathlib import Path
import zipfile

import pytest

from dataset_training import _safe_extract_and_validate


def _make_zip(path: Path, entries: dict[str, str | bytes]) -> None:
    with zipfile.ZipFile(path, "w") as archive:
        for name, value in entries.items():
            archive.writestr(name, value)


def test_valid_yolo_dataset_zip_is_normalized(tmp_path: Path) -> None:
    archive = tmp_path / "dataset.zip"
    _make_zip(archive, {
        "dataset/data.yaml": "train: images/train\nval: images/val\nnames: [plastic_bottle, floating_debris]\n",
        "dataset/images/train/sample.jpg": b"image",
        "dataset/images/val/sample.jpg": b"image",
        "dataset/labels/train/sample.txt": "0 0.5 0.5 0.2 0.2\n",
        "dataset/labels/val/sample.txt": "1 0.5 0.5 0.2 0.2\n",
        "dataset/images/train/.keep": "",
        "dataset/images/val/.keep": "",
    })
    target = tmp_path / "validated"
    target.mkdir()
    result = _safe_extract_and_validate(archive, target)
    assert result["image_count"] == 2
    assert result["classes"] == ["plastic_bottle", "floating_debris"]
    assert Path(result["yaml_path"]).is_file()


def test_dataset_zip_rejects_path_traversal(tmp_path: Path) -> None:
    archive = tmp_path / "unsafe.zip"
    _make_zip(archive, {"../escape.txt": "no"})
    target = tmp_path / "extracted"
    target.mkdir()
    with pytest.raises(ValueError, match="unsafe file path"):
        _safe_extract_and_validate(archive, target)
