namespace Kapacitet.Domain.Enums;

public enum MatchStatus
{
    PendingRequesterReview,
    RequesterDeclined,
    PendingSupplierConfirmation,
    SupplierDeclined,
    AgreementCreated,
    Expired,
    Withdrawn
}
