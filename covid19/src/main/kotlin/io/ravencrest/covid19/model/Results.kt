package io.ravencrest.covid19.model

import java.time.OffsetDateTime

data class Results(
  val lastUpdated: OffsetDateTime,
  val rows: List<TableRow>
)
