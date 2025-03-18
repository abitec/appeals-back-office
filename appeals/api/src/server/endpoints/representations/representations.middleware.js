import { dateIsPast } from '#utils/date-comparison.js';
import { ERROR_INVALID_APPEAL_STATE } from '@pins/appeals/constants/support.js';
import {
	APPEAL_REPRESENTATION_TYPE,
	APPEAL_REPRESENTATION_STATUS
} from '@pins/appeals/constants/common.js';

/**
@type {import("express").RequestHandler}
@returns {Promise<object|void>}
 */
export const validateRepresentationsToPublish = async (req, res, next) => {
	const { appeal: currentAppeal } = req;
	const { representations = [], appealTimetable } = currentAppeal || {};
	const { AWAITING_REVIEW, VALID, INCOMPLETE } = APPEAL_REPRESENTATION_STATUS;
	const { COMMENT, LPA_STATEMENT } = APPEAL_REPRESENTATION_TYPE;

	const hasRepresentationsAwaitingReview = representations?.some(
		({ status, representationType }) =>
			[COMMENT, LPA_STATEMENT].includes(representationType) && status === AWAITING_REVIEW
	);

	const hasValidRepresentations = representations?.some(
		({ status, representationType }) =>
			[COMMENT, LPA_STATEMENT].includes(representationType) && status === VALID
	);

	const hasIncompleteLpaStatement = representations?.some(
		({ status, representationType }) =>
			representationType === LPA_STATEMENT && status === INCOMPLETE
	);

	const hasItemsToShare = hasValidRepresentations || hasIncompleteLpaStatement;

	const today = new Date();

	const ipCommentsDueDatePassed =
		appealTimetable?.ipCommentsDueDate && dateIsPast(appealTimetable.ipCommentsDueDate, today);

	const lpaStatementDueDatePassed =
		appealTimetable?.lpaStatementDueDate && dateIsPast(appealTimetable.lpaStatementDueDate, today);

	if (
		ipCommentsDueDatePassed &&
		lpaStatementDueDatePassed &&
		!hasRepresentationsAwaitingReview &&
		hasItemsToShare
	) {
		next();
	} else {
		res.status(400).send({ errors: { appealStatus: ERROR_INVALID_APPEAL_STATE } });
	}
};
