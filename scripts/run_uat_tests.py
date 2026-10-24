import argparse
import shutil
import time
import traceback
import unittest
from datetime import datetime
from pathlib import Path
from xml.etree.ElementTree import Element, ElementTree, SubElement


class JunitResult(unittest.TestResult):
    def __init__(self):
        super().__init__()
        self.records = []
        self._started = {}

    def startTest(self, test):
        self._started[test] = time.perf_counter()
        super().startTest(test)

    def _record(self, test, outcome, detail=None, error=None):
        duration = time.perf_counter() - self._started.pop(test, time.perf_counter())
        self.records.append({
            "classname": test.__class__.__module__,
            "name": test._testMethodName,
            "story": getattr(getattr(test, test._testMethodName), "story_key", ""),
            "case": getattr(getattr(test, test._testMethodName), "case_id", ""),
            "time": duration,
            "outcome": outcome,
            "detail": detail or "",
            "error": error or "",
        })

    def addSuccess(self, test):
        self._record(test, "passed")
        super().addSuccess(test)

    def addFailure(self, test, err):
        self._record(test, "failed", str(err[1]), "".join(traceback.format_exception(*err)))
        super().addFailure(test, err)

    def addError(self, test, err):
        self._record(test, "failed", str(err[1]), "".join(traceback.format_exception(*err)))
        super().addError(test, err)

    def addSkip(self, test, reason):
        self._record(test, "skipped", reason)
        super().addSkip(test, reason)


def _write_junit(result, target):
    failed = sum(record["outcome"] == "failed" for record in result.records)
    skipped = sum(record["outcome"] == "skipped" for record in result.records)
    suite = Element("testsuite", {
        "name": "ShopEasy UAT",
        "tests": str(result.testsRun),
        "failures": str(failed),
        "skipped": str(skipped),
        "time": f"{sum(record['time'] for record in result.records):.3f}",
    })
    for record in result.records:
        testcase = SubElement(suite, "testcase", {"classname": record["classname"], "name": record["name"], "time": f"{record['time']:.3f}"})
        properties = SubElement(testcase, "properties")
        SubElement(properties, "property", {"name": "story", "value": record["story"]})
        if record["case"]:
            SubElement(properties, "property", {"name": "case", "value": record["case"]})
        if record["outcome"] == "failed":
            node = SubElement(testcase, "failure", {"message": record["detail"]})
            node.text = record["error"]
        elif record["outcome"] == "skipped":
            SubElement(testcase, "skipped", {"message": record["detail"]})
    ElementTree(suite).write(target, encoding="utf-8", xml_declaration=True)


def run(output_directory=None):
    project_root = Path(__file__).resolve().parents[1]
    suite = unittest.defaultTestLoader.discover(str(project_root / "tests_shopeasy"), top_level_dir=str(project_root))
    result = JunitResult()
    suite(result)
    output_directory = Path(output_directory or project_root / "output" / "results")
    output_directory.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    junit_path = output_directory / f"junit-{timestamp}.xml"
    _write_junit(result, junit_path)
    shutil.copyfile(junit_path, output_directory / "latest.xml")
    summary = {"total": result.testsRun, "passed": result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped), "failed": len(result.failures) + len(result.errors), "skipped": len(result.skipped)}
    return summary, junit_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=None)
    args = parser.parse_args()
    summary, junit_path = run(args.output)
    print(f"{summary['total']} total / {summary['passed']} passed / {summary['failed']} failed / {summary['skipped']} skipped")
    print(f"JUnit: {junit_path}")


if __name__ == "__main__":
    main()
