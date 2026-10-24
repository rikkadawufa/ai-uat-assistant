def story(key):
    """Attach the Azure DevOps story key used by the JUnit publisher."""
    def wrap(function):
        function.story_key = key
        return function
    return wrap


def case(case_id):
    """Attach the QA-approved test case ID from test-plans/."""
    def wrap(function):
        function.case_id = case_id
        return function
    return wrap
