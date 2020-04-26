package io.ravencrest.covid19.model

data class TableRow(
  val region: String,
  val cases: Long,
  val casesNormalized: Long,
  val change: Double?,
  val weeklyChange: Double?,
  val deaths: Long,
  val deathsNormalized: Long,
  val recovered: Long?,
  val recoveredNormalized: Long?,
  val population: Long,
  val changeNormalizedSeries: TimeSeries,
  val changeSeries: TimeSeries

)
